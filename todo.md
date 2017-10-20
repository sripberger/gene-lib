# TODO

## For 1.0.0
- Support disabling of `solutionFitness` by setting to `false`
- Add `onGeneration` integration test.
- Child count checks after each crossover call.
- Split `::run` into `::run` and `::runSync`.
    - Make `::run` put each generation run on back of event loop queue, so as
      not to block execution for too long.
    - Update README.
- Better error messages for async configuration mistakes.
- Post built api docs somewhere.
    - Add link to README.
