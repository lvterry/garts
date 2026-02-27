# Lessons

## 2026-02-24
- Pattern: When adding ESLint config in an existing codebase, run `npm run lint` immediately and fix pre-existing lint errors in the same pass so the setup is truly usable.
- Prevention rule: Treat lint/test as acceptance gates for config changes; do not stop after only adding config files.

## 2026-02-27
- Pattern: Curve strategy expansion increased complexity and visual quality regressed for user goals; features that overcomplicate core aesthetics may need full rollback, not incremental tuning.
- Prevention rule: For visual-generator upgrades, gate rollout by explicit visual acceptance criteria and keep a clean kill-switch/removal path for new shape families.
