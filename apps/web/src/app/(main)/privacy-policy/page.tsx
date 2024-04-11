import PageTitle from '@/components/page-title';
import SectionWrapper from '@/components/section-wrapper';

export default function PrivacyPolicyPage() {
    return (
        <SectionWrapper>
            <PageTitle title="Privacy Policy" />

            <div className="mb-12">
                <p>
                    One of our main priorities is the privacy of our users. This privacy policy (&quot;Privacy
                    Policy&quot;) explains how we collect, use, and share information when you access or use our Discord
                    bot or website. By accessing or using Coinz, you agree to the collection, use, and sharing of your
                    information as described in this Privacy Policy.
                </p>

                <h3 className="mt-6 font-bold text-2xl">1. Information We Collect</h3>
                <p>We collect information about you when you use Coinz, including:</p>
                <ul className="list-disc list-inside">
                    <li>Discord user ID</li>
                    <li>Coinz virtual currency balance</li>
                    <li>Items purchased within Coinz</li>
                    <li>Games played within Coinz</li>
                </ul>
                <p>We do not collect any personal information beyond your Discord user ID.</p>

                <h3 className="mt-6 font-bold text-2xl">2. Use of Information</h3>
                <p>
                    We use the information we collect to provide, maintain, and improve Coinz. Specifically, we use the
                    information to:
                </p>
                <ul className="list-disc list-inside">
                    <li>Allow you to accumulate virtual currency and purchase items within Coinz</li>
                    <li>Track game results and rankings within Coinz</li>
                    <li>Communicate with you about Coinz updates, promotions, and other relevant information</li>
                </ul>
                <p>
                    We will not use your information for any other purposes unless we have your explicit consent or are
                    required to do so by law.
                </p>

                <h3 className="mt-6 font-bold text-2xl">3. Sharing of Information</h3>
                <p>
                    We do not share any of your information with third parties except as necessary to provide, maintain,
                    and improve Coinz. Specifically, we may share your information with:
                </p>
                <ul className="list-disc list-inside">
                    <li>Discord, for the purpose of allowing you to use Coinz within the Discord platform</li>
                    <li>Third-party service providers who help us to provide, maintain, and improve Coinz</li>
                    <li>Law enforcement authorities or other government officials, if required by law</li>
                </ul>
                <p>We will never sell your information to third parties or use it for advertising purposes.</p>

                <h3 className="mt-6 font-bold text-2xl">4. Data Retention</h3>
                <p>
                    We will retain your information for as long as necessary to provide, maintain, and improve Coinz. If
                    you wish to delete your information, you can do so by using the built-in <code>/reset</code> command
                    in Coinz. If you are banned from using Coinz and wish to have your information deleted, you can
                    contact <code>siebe_b</code> on Discord. Please note that if you are banned, we will retain your
                    Discord user ID in our ban list for as long as the ban lasts.
                </p>

                <h3 className="mt-6 font-bold text-2xl">5. Security</h3>
                <p>
                    We take reasonable measures to protect your information from unauthorized access, disclosure, or
                    use. However, no data transmission over the internet or wireless network can be guaranteed to be
                    100% secure. Therefore, we cannot guarantee the security of your information.
                </p>

                <h3 className="mt-6 font-bold text-2xl">6. Changes to this Privacy Policy</h3>
                <p>
                    We reserve the right to modify this Privacy Policy at any time, with or without notice. If we make
                    any material changes to the policy, we will notify you by posting an updated version on our website
                    or by making an announcement on discord. Your continued use of Coinz following any changes to this
                    policy constitutes acceptance of those changes.
                </p>
            </div>
        </SectionWrapper>
    );
}
