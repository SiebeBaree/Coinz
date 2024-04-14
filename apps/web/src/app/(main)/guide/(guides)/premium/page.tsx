import Link from 'next/link';

export default function PremiumGuide() {
    return (
        <>
            <h2>What is Coinz Plus & Pro?</h2>
            <p>
                Coinz Plus & Pro (from now on referred to as Coinz Premium) is a paid subscription that unlocks
                additional features in Coinz. Coinz Premium is available in two tiers: Coinz Plus and Coinz Pro. Coinz
                Plus is the basic tier of Coinz Premium, while Coinz Pro is the more advanced tier.
            </p>

            <h2>What are the benefits of Coinz Plus & Pro?</h2>
            <p>
                We made Coinz Premium to be a nice to have, but not a paid to win subscription. We want to make sure
                that Coinz remains a great experience for all users, regardless of whether they have a subscription or
                not.
            </p>
            <p>
                To see the full list of features, please visit the <Link href="/premium">Coinz Premium page</Link>.
            </p>

            <h2>How can I get Coinz Plus & Pro?</h2>
            <p>
                You can get Coinz Premium by visiting the <Link href="/premium">Coinz Premium page</Link> and choosing
                the subscription that you want. You can pay for Coinz Premium using a credit card, PayPal, Google pay or
                Apple pay. Coinz uses LemonSqueezy to handle payments, so you can be sure that your payment information
                is safe and secure.
            </p>
            <p>
                After you have purchased a subscription, you will have access to Coinz Premium features for as long as
                your subscription is active. You can cancel your subscription at any time from the{' '}
                <Link href="/billing">Billing page</Link>. Please give it up to 24 hours for your subscription to be
                activated.
            </p>

            <h2>I&apos;ve bought Coinz Premium but did not receive anything?</h2>
            <p>
                Please check using <code>/weekly</code> or <code>/monthly</code> if you have access to the premium
                features. If you purchased more than 10 minutes ago and still do not have access, please message
                <em>siebe_b</em> on discord or email me at{' '}
                <Link href="mailto:siebe.baree@outlook.com">siebe.baree@outlook.com</Link>. I will help you as soon as
                possible.
            </p>
            <p>
                I'm working on adding support for notifications when you purchase a subscription. This feature will be
                available soon.
            </p>

            <h2>Why did you add paid subscriptions?</h2>
            <p>
                The first version of Coinz came out in June of 2022. Since them, I have been working on Coinz in my free
                time. I have been paying for the servers, the domain, and the other costs associated with running Coinz
                out of my own pocket. I have also been working on new features, fixing bugs, and responding to user
                feedback. I have been doing this because I love Coinz and I want to make it the best it can be. I
                literally spend thousands of hours working on Coinz and I have not earned a single dollar from it.
            </p>
            <p>
                However, I lose motivation quite often when working on Coinz becasue there are other things requiring me
                to spend my time and energy. Adding premium subscriptions will help me to keep working on Coinz and to
                make it even better. I hope that you will consider supporting Coinz by subscribing to Coinz Premium.
            </p>

            <h2>How do I cancel my subscription?</h2>
            <p>
                Visit the <Link href="/billing">Billing page</Link>. You can cancel your subscription from there. If you
                cancel your subscription, you will still have access to Coinz Premium until the end of your current
                billing cycle. After that, your subscription will be cancelled and you will lose access to Coinz Premium
                features.
            </p>

            <h2>How do I get a refund?</h2>
            <p>
                If you are not happy with Coinz Premium, you can get a refund within 30 days of your purchase. To get a
                refund, please send a message to <em>siebe_b</em> on discord or email me at{' '}
                <Link href="mailto:siebe.baree@outlook.com">siebe.baree@outlook.com</Link> and state your reasons why
                you want a refund. You will receive a refund within 7 days of your request being approved.
            </p>

            <h2>How do I upgrade or downgrade my subscription?</h2>
            <p>
                I am working on adding support for upgrading and downgrading your subscription. This feature will be
                available soon. In the meantime, if you want to upgrade or downgrade your subscription, you will need to
                cancel your current subscription and purchase a new one.
            </p>

            <h2>Are there any discounts available?</h2>
            <ul>
                <li>
                    <strong>Giveaways:</strong> You can participate in giveaways in the{' '}
                    <Link href="/support">Coinz Discord server</Link> to win discounts or even get Coinz Premium for
                    free.
                </li>
                <li>
                    <strong>Influencers:</strong> If you are a popular influencer with more than ~20.000 followers on
                    one platform and you are in the niche of Coinz (minigames, Discord, ...), you are ellible for a
                    discount on Coinz Premium.
                </li>
                <li>
                    <strong>Big servers:</strong> If you are the owner of a server with more than 3000 members, you are
                    ellible for a discount on Coinz Premium. The discount depends on the size of your server and the
                    number of active users. You can also get Coinz Premium coupon codes to give away to your members.
                </li>
                <li>
                    <strong>Helping Coinz:</strong> If you are helping Coinz by testing, developing, reporting bugs, or
                    doing anything else to help improve Coinz, you can get a discount on Coinz Premium.
                </li>
            </ul>

            <p>
                To receive your discount or get Coinz Premium for free, please message <em>siebe_b</em> on discord or
                email me at <Link href="mailto:siebe.baree@outlook.com">siebe.baree@outlook.com</Link>.
            </p>
        </>
    );
}
