import { z } from 'zod';

export const formSchema = z.object({
    passiveMode: z.boolean(),
    notifications: z.array(z.string()),
});
