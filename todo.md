# TODO

## For 1.0.0
- Invoke `onGeneration` hook for created generation.
- Add `onGeneration` hook to README.
- Support disabling of `solutionFitness` by setting to `false`
- Child count checks after each crossover call.
- Split `::run` into `::run` and `::runSync`.
    - Make `::run` put each generation run on back of event loop queue, so as
      not to block execution for too long.
    - Update README.
- Better error messages for async configuration mistakes.
- Post built api docs somewhere.
    - Add link to README.
