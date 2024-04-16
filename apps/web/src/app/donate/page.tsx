import { getCheckoutURL } from '@/actions/lemonsqueezy';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';

export default async function DonatePage() {
    const session = await auth();
    if (!session) {
        return redirect('https://store.coinzbot.xyz/buy/05235abb-6fcf-4e95-9c07-a78b5a42e2be?discount=0');
    }

    const checkout = await getCheckoutURL(342282);
    if (checkout.success && checkout.checkoutUrl) {
        return redirect(checkout.checkoutUrl);
    } else {
        return redirect('https://store.coinzbot.xyz/buy/05235abb-6fcf-4e95-9c07-a78b5a42e2be?discount=0');
    }
}
