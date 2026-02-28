import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // 1. Find ONE code in your CSV list that hasn't been handed out yet
  const { data: availableCoupon, error: fetchError } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_issued', false)
    .limit(1)
    .single(); 

  // Handle the scenario where you run out of codes in your CSV
  if (fetchError || !availableCoupon) {
    return res.status(200).send(`
      <div style="text-align: center; font-family: sans-serif; padding: 50px;">
        <h2>Sorry!</h2>
        <p>All of our promotional coupons have been claimed.</p>
      </div>
    `);
  }

  const uniqueCode = availableCoupon.code;

  // 2. Mark THIS specific code as "issued" in Supabase so the next person gets a new one
  const { error: updateError } = await supabase
    .from('coupons')
    .update({ is_issued: true })
    .eq('id', availableCoupon.id);

  if (updateError) {
     return res.status(500).json({ error: 'Failed to update coupon status.' });
  }

  // 3. Create your Cloudinary URL with updated positioning (Moved Left to x_40, Moved Down to y_30)
  const cloudinaryUrl = `https://res.cloudinary.com/dvgje8p9s/image/upload/l_text:Arial_35_bold:${uniqueCode},g_south_west,x_40,y_30/v1772260712/blank_coupon_kwdgvu.png`;

  // 4. Build the simple webpage the user will see
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Coupon</title>
      <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; font-family: sans-serif; margin: 0; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
        img { max-width: 100%; border-radius: 8px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Here is your unique coupon!</h2>
        <p>Show this code at the counter to redeem.</p>
        <img src="${cloudinaryUrl}" alt="Coupon Code" />
      </div>
    </body>
    </html>
  `;

  // 5. Send the webpage to the user's phone
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
