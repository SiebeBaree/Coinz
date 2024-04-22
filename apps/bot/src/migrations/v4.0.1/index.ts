import process from 'node:process';
import { connect } from 'mongoose';
import { Positions } from '../../lib/types';
import Business from '../../models/business';
import logger from '../../utils/logger';
import savedBusinesses from './businesses.json';

const oldBusinesses = savedBusinesses as any;

(async () => {
    logger.info('Connecting to the database...');
    await connect(process.env.DATABASE_URI!);

    logger.info('Starting migration...');
    const timestampMigrationStart = Date.now();

    const businesses = await Business.find();

    let businessCount = 0;
    for (const business of businesses) {
        const ceo = business.employees.find((employee) => employee.position === Positions.CEO);
        if (!ceo) {
            const oldBusiness = oldBusinesses.find((b: any) => b.name === business.name);
            if (!oldBusiness) {
                logger.error(`Business ${business.name} not found in saved businesses.`);
                continue;
            }

            const oldCEO = oldBusiness.employees.find((employee: any) => employee.role === 'ceo');
            if (!oldCEO) {
                logger.error(`CEO not found for business ${business.name}.`);
                continue;
            }

            businessCount += 1;
            await Business.updateOne(
                { name: business.name, 'employees.userId': oldCEO.userId },
                { $set: { 'employees.$.position': Positions.CEO } },
            );
        }
    }

    logger.info(
        `Migration finished in ${Date.now() - timestampMigrationStart}ms. Total businesses migrated: ${businessCount}`,
    );
    process.exit(0);
})();
