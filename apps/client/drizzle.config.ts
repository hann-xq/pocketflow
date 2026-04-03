import type { Config } from 'drizzle-kit';

const config: Config = {
    schema: './db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    driver: 'expo',
};

export default config;
