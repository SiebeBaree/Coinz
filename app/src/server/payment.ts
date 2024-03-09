import { db } from '@/server/db';
import { listProducts } from '@lemonsqueezy/lemonsqueezy.js';
import { Plan } from '@prisma/client';

const MAX_UPDATE_TIME = 1000 * 60 * 60 * 24;

export async function getProducts(): Promise<Plan[]> {
    let products = await db.plan.findMany();
    const updateTreshold = new Date(Date.now() - MAX_UPDATE_TIME);

    const lastUpdated: Date | undefined =
        products.length === 0
            ? undefined
            : products
                  .map((product) => product.updatedAt)
                  .sort((a, b) => b.getTime() - a.getTime())
                  .reverse()[0];

    if (!lastUpdated || lastUpdated.getTime() < updateTreshold.getTime()) {
        const fetchedProducts = await listProducts();

        if (fetchedProducts.statusCode !== 200 || !fetchedProducts.data || fetchedProducts.error) {
            console.log('Error fetching products:', fetchedProducts.error);
        } else {
            for (const newProduct of fetchedProducts.data.data) {
                const existingProduct = await db.plan.findFirst({
                    where: { productId: Number.parseInt(newProduct.id, 10) },
                });
                if (existingProduct) {
                    await db.plan.update({
                        where: {
                            productId: Number.parseInt(newProduct.id, 10),
                        },
                        data: {
                            name: newProduct.attributes.name,
                            variantName: newProduct.attributes.name,
                            description: newProduct.attributes.description,
                            price: newProduct.attributes.price,
                            status: newProduct.attributes.status,
                        },
                    });
                } else {
                    await db.plan.create({
                        data: {
                            productId: Number.parseInt(newProduct.id, 10),
                            variantId: -1,
                            name: newProduct.attributes.name,
                            variantName: newProduct.attributes.name,
                            description: newProduct.attributes.description,
                            price: newProduct.attributes.price,
                            status: newProduct.attributes.status,
                        },
                    });
                }
            }

            products = await db.plan.findMany();
        }
    }

    return products;
}
