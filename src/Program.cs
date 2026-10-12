Vintasoft.Barcode.SkiaSharpAssembly.Init();

#if !DISABLE_AI
try
{
    // initialize Vintasoft.Barcode.AI.1D assembly
    Vintasoft.Barcode.Ai1DAssembly.Init();
}
catch
{
#if DEBUG
    throw;
#endif
}

try
{
    // initialize Vintasoft.Barcode.AI.2D assembly
    Vintasoft.Barcode.Ai2DAssembly.Init();
}
catch
{
#if DEBUG
    throw;
#endif
}
#endif


// register the evaluation license for VintaSoft Barcode .NET SDK
Vintasoft.Barcode.BarcodeGlobalSettings.Register("REG_USER", "REG_EMAIL", "EXPIRATION_DATE", "REG_CODE");

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddControllersWithViews().AddNewtonsoftJson();
builder.Services.AddSession();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();
app.UseSession();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
});

app.MapRazorPages();

app.Run();
