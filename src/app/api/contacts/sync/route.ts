import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session: any = await getServerSession();
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { name, phone, notes } = await req.json();

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: session.accessToken });

        const people = google.people({ version: "v1", auth });

        const response = await people.people.createContact({
            requestBody: {
                names: [{ givenName: name }],
                phoneNumbers: [{ value: phone, type: "mobile" }],
                biographies: [{ value: notes || "Added from BrickFlow CRM" }],
                memberships: [
                    {
                        contactGroupMembership: {
                            contactGroupResourceName: "contactGroups/myContacts",
                        },
                    },
                ],
            },
        });

        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error("Google Contact Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
