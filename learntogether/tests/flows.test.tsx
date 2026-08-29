import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

/**
 * End-to-end tests of the flows a learner actually walks through, rendered with
 * real state and real (in-memory) storage. Only the router is stubbed.
 *
 * These exist to protect the promises the app makes to its learner: nothing is
 * timed, a wrong answer is never punished, retries are unlimited, and progress
 * survives.
 */

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  pathname: "/home",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
    back: navigation.back,
    prefetch: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => navigation.pathname,
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
}));

import { SessionProvider } from "@/features/learners/SessionProvider";
import { createLocalRepositories, MemoryDriver, type Repositories } from "@/lib/storage";
import { CreateLearnerForm } from "@/features/learners/CreateLearnerForm";
import { FirstLesson } from "@/features/onboarding/FirstLesson";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import { PracticeActivity } from "@/features/practice/PracticeActivity";
import { LetterLesson } from "@/features/alphabet/LetterLesson";
import HomePage from "@/app/(learner)/home/page";
import SettingsPage from "@/app/(caregiver)/settings/page";
import LandingPage from "@/app/page";
import { getLetter } from "@/data/alphabet";
import type { Learner } from "@/types";

const LEARNER: Learner = {
  id: "learner-1",
  name: "Sam",
  age: 15,
  avatar: "fox",
  createdAt: 1000,
};

let repositories: Repositories;

function renderApp(ui: ReactElement) {
  return render(<SessionProvider repositories={repositories}>{ui}</SessionProvider>);
}

/** Seeds a learner so screens behind the first-run flow can be rendered. */
async function seedLearner() {
  await repositories.learners.save(LEARNER);
  await repositories.settings.save({
    audioEnabled: true,
    soundEffectsEnabled: true,
    musicEnabled: false,
    theme: "system",
    caregiverPin: null,
    onboardingComplete: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  repositories = createLocalRepositories(new MemoryDriver());
});

describe("onboarding", () => {
  it("shows exactly three screens and ends at setup", async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingFlow />);

    expect(screen.getByText("Learn at your own pace.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Learn anywhere.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Celebrate every step.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /get started/i }));
    expect(navigation.push).toHaveBeenCalledWith("/setup");
  });

  it("mentions offline use and the absence of ads", async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingFlow />);
    // Both promises live on the second screen, "Learn anywhere."
    await user.click(screen.getByRole("button", { name: /next/i }));

    const body = screen.getByText(/without Wi-Fi or mobile data/i);
    expect(body).toBeInTheDocument();
    expect(body).toHaveTextContent(/no ads, ever/i);
  });

  it("can be skipped without creating anything", async () => {
    const user = userEvent.setup();
    renderApp(<OnboardingFlow />);
    await user.click(screen.getByRole("button", { name: /skip/i }));
    expect(navigation.push).toHaveBeenCalledWith("/setup");
  });
});

describe("creating a learner", () => {
  it("asks only for a name, an age and an avatar", async () => {
    renderApp(<CreateLearnerForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Age")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fox" })).toBeInTheDocument();
    // Nothing resembling an account.
    expect(screen.queryByLabelText(/email|password/i)).toBeNull();
  });

  it("saves the learner locally and moves on to the first lesson", async () => {
    const user = userEvent.setup();
    renderApp(<CreateLearnerForm />);

    await user.type(screen.getByLabelText("Name"), "Sam");
    await user.type(screen.getByLabelText("Age"), "15");
    await user.click(screen.getByRole("button", { name: "Owl" }));
    await user.click(screen.getByRole("button", { name: /start learning/i }));

    await waitFor(async () => {
      const saved = await repositories.learners.list();
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({ name: "Sam", age: 15, avatar: "owl" });
    });
    expect(navigation.push).toHaveBeenCalledWith("/first-lesson");
  });

  it("asks for a name rather than saving an empty learner", async () => {
    const user = userEvent.setup();
    renderApp(<CreateLearnerForm />);
    await user.type(screen.getByLabelText("Age"), "15");
    await user.click(screen.getByRole("button", { name: /start learning/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please add a name.");
    expect(await repositories.learners.list()).toEqual([]);
  });

  it("only accepts digits in the age field", async () => {
    const user = userEvent.setup();
    renderApp(<CreateLearnerForm />);
    const age = screen.getByLabelText("Age");
    await user.type(age, "1a5b");
    expect(age).toHaveValue("15");
  });
});

describe("the first lesson", () => {
  async function startFirstLesson() {
    await seedLearner();
    await repositories.settings.save({
      audioEnabled: true,
      soundEffectsEnabled: true,
      musicEnabled: false,
      theme: "system",
      caregiverPin: null,
      onboardingComplete: false,
    });
    const user = userEvent.setup();
    renderApp(<FirstLesson />);
    await screen.findByText("Your first lesson");
    return user;
  }

  it("walks through A, then Apple, then finding A", async () => {
    const user = await startFirstLesson();

    expect(screen.getByText("A")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByText("Apple")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByText("Find A.")).toBeInTheDocument();
  });

  it("encourages rather than punishing a wrong tap, and allows a retry", async () => {
    const user = await startFirstLesson();
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    await user.click(screen.getByRole("button", { name: "B" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Good try. Find A.");
    // The correct answer is still available: retries are unlimited.
    expect(screen.getByRole("button", { name: "A" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "A" }));
    expect(await screen.findByText(/Well done/)).toBeInTheDocument();
  });

  it("awards the first star and completes onboarding", async () => {
    const user = await startFirstLesson();
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: "A" }));

    await screen.findByText(/Well done/);

    await waitFor(async () => {
      const rewards = await repositories.rewards.get(LEARNER.id);
      expect(rewards!.stars).toBeGreaterThan(0);
      expect((await repositories.settings.get()).onboardingComplete).toBe(true);
    });
  });

  it("records progress for the letter A", async () => {
    const user = await startFirstLesson();
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: "A" }));
    await screen.findByText(/Well done/);

    await waitFor(async () => {
      const record = await repositories.progress.get(LEARNER.id, "letter-a");
      expect(record?.successes).toBe(1);
    });
  });
});

describe("home", () => {
  it("greets the learner by name", async () => {
    await seedLearner();
    renderApp(<HomePage />);
    expect(await screen.findByRole("heading", { name: "Sam" })).toBeInTheDocument();
  });

  it("offers Continue learning, starting at the letter A", async () => {
    await seedLearner();
    renderApp(<HomePage />);
    const link = await screen.findByRole("link", { name: /Continue learning/ });
    expect(link).toHaveAttribute("href", "/learn/alphabet/a");
  });

  it("reaches every activity area in a single tap", async () => {
    await seedLearner();
    renderApp(<HomePage />);
    await screen.findByRole("heading", { name: "Sam" });

    for (const [name, href] of [
      ["Letters", "/learn/alphabet"],
      ["Numbers", "/learn/numbers"],
      ["Trace", "/trace"],
      ["Practice", "/practice"],
      ["Games", "/games"],
      ["Rewards", "/rewards"],
    ] as const) {
      expect(screen.getByRole("link", { name: new RegExp(name) })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("links to the caregiver area", async () => {
    await seedLearner();
    renderApp(<HomePage />);
    expect(await screen.findByRole("link", { name: /Caregiver area/ })).toHaveAttribute(
      "href",
      "/caregiver",
    );
  });
});

describe("a letter lesson", () => {
  it("shows the letter, both cases, the word and a link to tracing", async () => {
    await seedLearner();
    renderApp(<LetterLesson item={getLetter("C")!} />);

    const tile = screen.getByRole("button", { name: /Letter C, big and small/ });
    expect(tile).toHaveTextContent("C");
    expect(tile).toHaveTextContent("c");
    expect(screen.getByText("Cat")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trace C/ })).toHaveAttribute(
      "href",
      "/trace/letters/c",
    );
  });

  it("offers a separate button for the letter's sound", () => {
    renderApp(<LetterLesson item={getLetter("C")!} />);
    expect(
      screen.getByRole("button", { name: /Hear the sound C makes/ }),
    ).toBeInTheDocument();
  });

  it("records that the lesson was opened", async () => {
    await seedLearner();
    renderApp(<LetterLesson item={getLetter("C")!} />);
    await waitFor(async () => {
      const record = await repositories.progress.get(LEARNER.id, "letter-c");
      expect(record?.status).toBe("introduced");
    });
  });
});

describe("settings", () => {
  it("lets a caregiver turn the theme music off, and remembers it", async () => {
    await seedLearner();
    const user = userEvent.setup();
    renderApp(<SettingsPage />);

    const toggle = await screen.findByRole("switch", { name: /Theme music/ });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await waitFor(async () => {
      expect((await repositories.settings.get()).musicEnabled).toBe(true);
    });
  });

  it("explains when the music plays, so the choice is informed", async () => {
    await seedLearner();
    renderApp(<SettingsPage />);
    const toggle = await screen.findByRole("switch", { name: /Theme music/ });
    expect(toggle).toHaveTextContent(/when the app opens/i);
    expect(toggle).toHaveTextContent(/after a correct answer/i);
  });

  it("keeps spoken audio and music as separate choices", async () => {
    await seedLearner();
    renderApp(<SettingsPage />);
    expect(await screen.findByRole("switch", { name: /Spoken audio/ })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Sound effects/ })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Theme music/ })).toBeInTheDocument();
  });
});

describe("identification practice", () => {
  it("never disables the right answer after a wrong tap", async () => {
    await seedLearner();
    const user = userEvent.setup();
    renderApp(
      <PracticeActivity
        pool={[getLetter("A")!, getLetter("B")!, getLetter("C")!]}
        mode="identify"
        length={2}
        doneHref="/practice"
      />,
    );

    const prompt = await screen.findByText(/^Find [A-Z]\.$/);
    const target = prompt.textContent!.replace("Find ", "").replace(".", "");
    const options = screen.getAllByRole("button", { name: /^[A-Z]$/ });
    const wrong = options.find((button) => button.textContent !== target)!;

    await user.click(wrong);

    const status = await screen.findAllByRole("status");
    expect(status.some((node) => /Good try/.test(node.textContent ?? ""))).toBe(true);
    // Every option, including the right one, remains tappable.
    for (const option of screen.getAllByRole("button", { name: /^[A-Z]$/ })) {
      expect(option).toBeEnabled();
    }
  });

  it("celebrates a correct answer and offers the next question", async () => {
    await seedLearner();
    const user = userEvent.setup();
    renderApp(
      <PracticeActivity
        pool={[getLetter("A")!, getLetter("B")!, getLetter("C")!]}
        mode="identify"
        length={2}
        doneHref="/practice"
      />,
    );

    const prompt = await screen.findByText(/^Find [A-Z]\.$/);
    const target = prompt.textContent!.replace("Find ", "").replace(".", "");
    await user.click(screen.getByRole("button", { name: target }));

    expect(await screen.findByRole("button", { name: /next|finish/i })).toBeInTheDocument();
  });

  it("shows progress through the round without any timer", async () => {
    await seedLearner();
    renderApp(
      <PracticeActivity
        pool={[getLetter("A")!, getLetter("B")!, getLetter("C")!]}
        mode="identify"
        length={4}
        doneHref="/practice"
      />,
    );

    const bar = await screen.findByRole("progressbar", { name: /this round/i });
    expect(within(bar.parentElement!).getByText("1 of 4")).toBeInTheDocument();
    // Nothing counts down.
    expect(screen.queryByText(/seconds|time left|timer/i)).toBeNull();
  });

  it("gives no text clue in listening mode", async () => {
    await seedLearner();
    renderApp(
      <PracticeActivity
        pool={[getLetter("A")!, getLetter("B")!, getLetter("C")!]}
        mode="listen"
        length={2}
        doneHref="/practice"
      />,
    );
    expect(await screen.findByText("Listen, then choose.")).toBeInTheDocument();
    expect(screen.queryByText(/^Find /)).toBeNull();
  });
});

describe("the landing page", () => {
  beforeEach(() => {
    // jsdom has no matchMedia; report "running in a browser tab, not installed".
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  it("welcomes a first-time visitor and offers to install", async () => {
    renderApp(<LandingPage />);
    // Anchor on something only the landing renders: the splash shows the same
    // heading, so waiting on that would resolve against a node about to be
    // replaced.
    expect(
      await screen.findByRole("button", { name: /Start in the browser/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "LearnTogether" })).toBeInTheDocument();
    expect(screen.getByText(/Works with no internet once installed/i)).toBeInTheDocument();
  });

  it("lets a first-time visitor skip straight into the app", async () => {
    const user = userEvent.setup();
    renderApp(<LandingPage />);
    await user.click(
      await screen.findByRole("button", { name: /Start in the browser/i }),
    );
    expect(navigation.push).toHaveBeenCalledWith("/onboarding");
  });

  it("never shows a returning learner the landing page", async () => {
    await seedLearner();
    renderApp(<LandingPage />);
    // Straight to Home: nobody should walk past a landing page to reach a lesson.
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/home"));
    expect(screen.queryByRole("button", { name: /Start in the browser/i })).toBeNull();
  });

  it("sends a learner who has not finished onboarding back into it", async () => {
    await repositories.learners.save(LEARNER);
    await repositories.settings.save({
      audioEnabled: true,
      soundEffectsEnabled: true,
      musicEnabled: false,
      theme: "system",
      caregiverPin: null,
      onboardingComplete: false,
    });
    renderApp(<LandingPage />);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/onboarding"));
  });
});
