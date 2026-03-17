import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncBulkPhotos() {
    const publicDir = path.join(process.cwd(), 'public', 'products');

    // Ensure the base directory exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
        console.log('Created /public/products directory.');
    }

    // Define categories to match your database schema
    const categories = ['brick', 'tile', 'paver', 'jali', 'cladding', 'roofing', 'project'];
    let addedCount = 0;

    console.log('🔄 Scanning /public/products for new images...');

    for (const category of categories) {
        const catDir = path.join(publicDir, category);

        // Create category folder if it doesn't exist to guide the user
        if (!fs.existsSync(catDir)) {
            fs.mkdirSync(catDir, { recursive: true });
            continue;
        }

        const files = fs.readdirSync(catDir);
        for (const file of files) {
            // Process only image files
            if (file.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i)) {
                // Clean up title: 'red_brick-1' -> 'Red Brick 1'
                const rawName = path.parse(file).name;
                const formattedName = rawName
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());

                // Relative URL that Next.js serves from public directory
                const imagePath = `/products/${category}/${file}`;

                // Check if image is already saved in the database
                const existing = await prisma.product.findFirst({
                    where: { image: imagePath }
                });

                if (!existing) {
                    await prisma.product.create({
                        data: {
                            name: formattedName,
                            category: category,
                            image: imagePath,
                            purchaseRate: 0,
                            sellingRate: 0,
                            description: '',
                        } as any
                    });
                    console.log(`✅ Auto-added: "${formattedName}" to ${category}`);
                    addedCount++;
                }
            }
        }
    }

    if (addedCount === 0) {
        console.log('✨ No new photos found. Drop images into the folders inside /public/products and run again!');
    } else {
        console.log(`🎉 Successfully synced ${addedCount} new photos into the database!`);
    }
}

syncBulkPhotos().catch(console.error).finally(() => prisma.$disconnect());
