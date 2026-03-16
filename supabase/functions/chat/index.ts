import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Verifica autenticação via token Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { error: authError } = await supabase.auth.getUser();
    if (authError) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { model, max_tokens, system, messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model ?? "claude-sonnet-4-6",
        max_tokens: max_tokens ?? 1000,
        system,
        messages,
      }),
    });

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: resp.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
