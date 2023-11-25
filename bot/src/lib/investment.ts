import type { IInvestment } from '../models/Investment';
import InvestmentModel from '../models/Investment';

export default class Investment {
    private readonly INVESTMENTS = new Map<string, IInvestment>();

    public async getInvestmentsByType(type: string): Promise<IInvestment[]> {
        return InvestmentModel.find({ type });
    }

    public async getInvestment(ticker: string, fetch = false): Promise<IInvestment | null> {
        const cachedInvestment = fetch ? undefined : this.INVESTMENTS.get(ticker);

        if (cachedInvestment === undefined || cachedInvestment.expires.getTime() < Date.now()) {
            const investment = await InvestmentModel.findOne({ ticker });
            if (!investment) return null;

            this.INVESTMENTS.set(ticker, investment);
            return investment;
        }

        return cachedInvestment;
    }
}
