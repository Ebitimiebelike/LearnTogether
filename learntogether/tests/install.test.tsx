import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resolveInstallState } from "@/lib/pwa/install";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

/**
 * Installing to the home screen.
 *
 * The rule these protect: the button must never lie. It offers a real install
 * only where one exists, shows instructions on iOS where Apple allows nothing
 * else, and says so plainly where neither is possible.
 */

describe("resolveInstallState", () => {
  it("offers nothing once the app is already installed", () => {
    expect(
      resolveInstallState({ hasPrompt: true, isIOS: false, isStandalone: true }),
    ).toBe("installed");
  });

  it("treats an installed iOS app as installed too", () => {
    expect(
      resolveInstallState({ hasPrompt: false, isIOS: true, isStandalone: true }),
    ).toBe("installed");
  });

  it("uses the native dialog when the browser offers one", () => {
    expect(
      resolveInstallState({ hasPrompt: true, isIOS: false, isStandalone: false }),
    ).toBe("prompt");
  });

  it("falls back to Share instructions on iOS", () => {
    expect(
      resolveInstallState({ hasPrompt: false, isIOS: true, isStandalone: false }),
    ).toBe("ios-share");
  });

  it("prefers a real prompt over instructions when both apply", () => {
    expect(
      resolveInstallState({ hasPrompt: true, isIOS: true, isStandalone: false }),
    ).toBe("prompt");
  });

  it("reports unavailable on a desktop browser that cannot install", () => {
    expect(
      resolveInstallState({ hasPrompt: false, isIOS: false, isStandalone: false }),
    ).toBe("unavailable");
  });
});

/** A stand-in for Chromium's non-standard install event. */
function firePrompt() {
  const event = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  };
  const prompt = vi.fn(() => Promise.resolve());
  event.prompt = prompt;
  event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
  window.dispatchEvent(event);
  return prompt;
}

describe("InstallAppButton", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // jsdom has no matchMedia; default to "not installed".
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stays quiet until the browser has had a chance to offer a prompt", () => {
    render(<InstallAppButton />);
    // Nothing rendered yet: claiming "can't install" too early would be wrong.
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/open this page on an Android/i)).toBeNull();
  });

  it("shows an Install button once the browser offers one", async () => {
    render(<InstallAppButton />);
    firePrompt();
    expect(
      await screen.findByRole("button", { name: /install app/i }),
    ).toBeInTheDocument();
  });

  it("opens the native install dialog when tapped", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InstallAppButton />);
    const prompt = firePrompt();

    await user.click(await screen.findByRole("button", { name: /install app/i }));
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  });

  it("confirms once the app has been installed", async () => {
    render(<InstallAppButton />);
    firePrompt();
    await screen.findByRole("button", { name: /install app/i });

    window.dispatchEvent(new Event("appinstalled"));
    expect(await screen.findByText(/installed on this device/i)).toBeInTheDocument();
  });

  it("can hide itself entirely once installed", async () => {
    const { container } = render(<InstallAppButton hideWhenInstalled />);
    firePrompt();
    await screen.findByRole("button", { name: /install app/i });

    window.dispatchEvent(new Event("appinstalled"));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("explains where installing is possible when this browser cannot", async () => {
    render(<InstallAppButton />);
    // No prompt arrives; after the settle delay it should explain rather than
    // leaving a button that would do nothing.
    await vi.advanceTimersByTimeAsync(1500);
    expect(
      await screen.findByText(/open this page on an Android tablet/i),
    ).toBeInTheDocument();
  });

  describe("on iOS, where Apple allows no install dialog", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", {
        ...window.navigator,
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
        maxTouchPoints: 5,
      });
    });

    it("offers Share instructions instead of a dialog that cannot exist", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<InstallAppButton />);

      await user.click(await screen.findByRole("button", { name: /install app/i }));

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveTextContent(/Add to Home Screen/i);
      expect(dialog).toHaveTextContent(/Share/i);
    });

    it("warns that only Safari can do it", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<InstallAppButton />);
      await user.click(await screen.findByRole("button", { name: /install app/i }));
      expect(await screen.findByRole("dialog")).toHaveTextContent(
        /only works in Safari/i,
      );
    });
  });
});
