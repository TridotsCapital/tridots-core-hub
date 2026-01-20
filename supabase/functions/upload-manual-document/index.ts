import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content, fileName, documentName, description, visibleInAgencyDrive } = await req.json();

    if (!content || !fileName || !documentName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content, fileName, documentName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert content to Uint8Array for upload
    const encoder = new TextEncoder();
    const fileData = encoder.encode(content);
    const filePath = `templates/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("term-templates")
      .upload(filePath, fileData, {
        contentType: "text/markdown",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin user for uploaded_by field (use service role context)
    const { data: adminUser } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: "No admin user found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create record in term_templates
    const { data: templateData, error: insertError } = await supabase
      .from("term_templates")
      .insert({
        name: documentName,
        description: description || null,
        file_name: fileName,
        file_path: filePath,
        file_size: fileData.length,
        file_type: "text/markdown",
        is_active: true,
        visible_in_agency_drive: visibleInAgencyDrive ?? false,
        uploaded_by: adminUser.id,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create template record", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Document uploaded successfully",
        template: templateData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
