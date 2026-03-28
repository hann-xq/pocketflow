/**
 * Implement this class if you wish to seed the database with data.
 *
 * This is primarily meant for production values, i.e., setting up the initial
 * state of the application. Therefore, when implementing your seed method, you
 * may want to first check if the database already contains some values. We want
 * to avoid overriding existing user data by programmatic values! This can be
 * done by, for example, checking if the table already contains any values:
 *
 * ```ts
 * async seed(): Promise<void> {
 *   // The table has already been seeded or contains user data; skip seeding.
 *   if ((await this.repository.count()) > 0) {
 *     return;
 *   }
 *
 *   // Your seed logic...
 * }
 * ```
 *
 * Certain entities may sometimes depend on other data, and thus, we want to
 * execute seeders in a predefined order. This can be done by overriding the
 * `seedPriority()` method with a non-negative, non-zero number. The seeders are
 * then sorted in ascending order, i.e., the lowest priority is executed
 * first. Although, keep these numbers moderate!
 *
 * You may ask how the seeder is run, maybe even when? This is automagically
 * done by the seeder service class once the seeder module is initialized. It
 * iterates over all registered providers across all modules imported by the
 * application. Therefore, the only thing you must do in your own service is to
 * implement this interface. No import or export needs be done afterward.
 *
 * It is safe to assume that if the table of the entity in your service is
 * empty, the entire application is being run for the first time.
 */
export interface ISeeder {
  /**
   * Return the absolute priority of this seeder. A lower value is executed first.
   *
   * If this seeder does not depend on others, it should return 0.
   */
  seedPriority(): number;

  /**
   * Execute the seeding logic.
   */
  seed(): Promise<void>;
}
