import { z } from 'zod';

export const preferencesSchema = z.object({
    passiveMode: z.boolean(),
});

export type PreferencesSchema = z.infer<typeof preferencesSchema>;

export const notificationsSchema = z.object({
    notifications: z.array(z.string()),
});

export type NotificationsSchema = z.infer<typeof notificationsSchema>;
