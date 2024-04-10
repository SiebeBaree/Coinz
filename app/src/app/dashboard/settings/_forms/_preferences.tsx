'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { PreferencesSchema, preferencesSchema } from '../schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

export default function SettingsPreferences() {
    const form = useForm<PreferencesSchema>({
        resolver: zodResolver(preferencesSchema),
        defaultValues: {
            passiveMode: false,
        },
    });

    function onSubmit(values: PreferencesSchema) {
        console.log(values);
    }

    return (
        <div className="bg-secondary p-4 rounded-md">
            <h1 className="text-2xl font-semibold mb-2">Change your Coinz preferences</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="passiveMode"
                        render={({ field }) => (
                            <FormItem className="space-y-0 flex justify-between items-center gap-4">
                                <div>
                                    <FormLabel className="text-base">Passive Mode</FormLabel>
                                    <FormDescription>
                                        When enabled, you will not be able to steal from other users but other users
                                        will not be able to steal from you.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch defaultChecked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </div>
    );
}
