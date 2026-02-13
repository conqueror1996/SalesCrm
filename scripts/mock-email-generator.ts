
import axios from 'axios';

const API_ENDPOINT = 'http://localhost:3000/api/leads';

const SAMPLE_LEADS = [
    {
        name: "Rajesh Kumar",
        phone: "+919876543210",
        email: "rajesh.k@example.com",
        product: "Red Bricks (Class 1)",
        quantity: "5000 Pieces",
        city: "Pune, Maharashtra",
        message: "Need urgent delivery for construction site in Baner.",
        source: "IndiaMART"
    },
    {
        name: "Vikram Singh",
        phone: "+919988776655",
        product: "Cement Bags (OPC 53)",
        quantity: "200 Bags",
        city: "Mumbai",
        source: "IndiaMART"
    },
    {
        name: "Anita Desai",
        phone: "+918877665544",
        product: "Fly Ash Bricks",
        quantity: "10000 Nos",
        city: "Nashik",
        source: "IndiaMART",
        message: "Please send quote for bulk order."
    }
];

async function generateLead() {
    const randomLead = SAMPLE_LEADS[Math.floor(Math.random() * SAMPLE_LEADS.length)];
    // Add randomness to make it look unique
    const uniqueLead = {
        ...randomLead,
        received_at: new Date().toISOString(),
        name: `${randomLead.name} ${Math.floor(Math.random() * 100)}`, // Vary name slightly
    };

    console.log(`📤 Sending Mock Lead: ${uniqueLead.name}...`);

    try {
        await axios.post(API_ENDPOINT, uniqueLead);
        console.log('✅ Lead Sent Successfully');
    } catch (error) {
        console.error('❌ Failed to send lead:', error);
    }
}

// Send one immediately
generateLead();

// Send another every 10 seconds
setInterval(generateLead, 10000);
