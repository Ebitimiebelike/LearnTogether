# Information Architecture

## Overview

LearnTogether is organized around a simple principle:

> A learner should never feel lost.

Every screen should have a clear purpose, and navigation should remain predictable throughout the application.

---

# Application Structure

LearnTogether

├── Onboarding
│   ├── Welcome
│   ├── Create Learner
│   ├── Choose Avatar
│   └── Setup Complete
│
├── Home
│
├── Learn
│   ├── Alphabet
│   ├── Numbers
│   ├── Words
│   ├── Colors
│   ├── Shapes
│   ├── Animals
│   ├── Fruits
│   ├── Body Parts
│   ├── Emotions
│   ├── Daily Activities
│   └── Reading Practice
│
├── Play
│   ├── Letter Matching
│   ├── Number Matching
│   ├── Memory Game
│   ├── Picture Match
│   ├── Counting Game
│   └── Listening Game
│
├── Rewards
│
├── Progress
│
├── Caregiver Dashboard
│
└── Settings

---

# Home

Purpose:

Provide quick access to today's learning.

Contains:

- Greeting
- Daily Goal
- Continue Learning
- Learn Categories
- Games
- Progress Summary

Actions:

- Start lesson
- Resume lesson
- Open games
- View rewards

---

# Learn

Purpose:

Teach new concepts.

Each learning category follows the same structure.

Introduction

↓

Teaching

↓

Practice

↓

Review

↓

Reward

↓

Save Progress

Categories:

Alphabet

Numbers

Words

Colors

Shapes

Animals

Fruits

Reading

Future categories can be added without changing navigation.

---

# Games

Purpose:

Reinforce learning through play.

Games never introduce new knowledge.

Games only reinforce previously learned concepts.

Example:

If the learner has learned A, B and C,

games only use A, B and C.

---

# Rewards

Purpose:

Celebrate achievements.

Contains:

- Stars
- Badges
- Daily Streak
- Milestones

Rewards never expire.

---

# Progress

Purpose:

Visualize improvement.

Contains:

Letters Mastered

Words Learned

Numbers Learned

Time Practiced

Current Streak

Weekly Activity

Parents should immediately understand how the learner is progressing.

---

# Caregiver Dashboard

Purpose:

Provide caregivers with insight.

Features:

Today's Activity

Weak Areas

Strong Areas

Recommended Lessons

Practice History

Future:

Export reports

Therapist sharing

Cloud backup

---

# Settings

Contains:

Audio

Language

Theme

Accessibility

Reset Progress

About

Privacy

---

# Navigation Rules

A learner should reach any lesson within three taps.

The Back button should always return to the previous logical screen.

Navigation should never surprise the learner.

---

# Design Rules

Every screen should answer one question.

Examples:

"What letter is this?"

"Can you match these?"

"Which picture is correct?"

Avoid presenting multiple learning objectives on the same screen.

---

# Future Expansion

The architecture should support:

Multiple learners

Multiple languages

Downloadable lesson packs

Speech exercises

Writing exercises

Teacher dashboard

Cloud synchronization

AI-assisted lesson generation

Mobile applications

Wearables

Without requiring major architectural changes.