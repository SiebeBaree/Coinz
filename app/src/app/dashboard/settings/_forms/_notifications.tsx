'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { notificationsSchema, NotificationsSchema } from '../schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

export default function SettingsNotifications() {
    const form = useForm<NotificationsSchema>({
        resolver: zodResolver(notificationsSchema),
        defaultValues: {
            notifications: [],
        },
    });

    function onSubmit(values: NotificationsSchema) {
        console.log(values);
    }

    return (
        <div className="bg-secondary p-4 rounded-md">
            <h1 className="text-2xl font-semibold mb-2">Update your notifications</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="notifications"
                        render={({ field }) => (
                            <FormItem className="space-y-0 flex justify-between items-center gap-4">
                                <div>
                                    <FormLabel className="text-base">Notifications</FormLabel>
                                    <FormDescription>
                                        Select the notifications you would like to receive.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        defaultChecked={field.value.includes('email')}
                                        onCheckedChange={(checked) => {
                                            form.setValue('notifications', checked ? ['email'] : []);
                                        }}
                                    />
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
