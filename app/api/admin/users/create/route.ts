import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Get user data from request body
    const userData = await request.json()

    // Validate required fields
    if (!userData.name || !userData.lastName || !userData.cadeteId || !userData.transportType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create user profile in Supabase
    const { data, error } = await supabase
      .from("cadetes")
      .insert({
        name: userData.name,
        last_name: userData.lastName,
        cadete_id: userData.cadeteId,
        transport_type: userData.transportType,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Generate a temporary user_id if we don't have auth
        user_id: userData.userId || `temp-${Date.now()}`,
      })
      .select()

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error: any) {
    console.error("Error in create user API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
