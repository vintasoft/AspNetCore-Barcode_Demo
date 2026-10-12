using Microsoft.AspNetCore.Mvc;

namespace AspNetCoreBarcodeDemo.Controllers
{
    /// <summary>
    /// ASP.NET Core controller for Barcode Writer Demo page.
    /// </summary>
    public class BarcodeWriterDemoController : Controller
    {
        //
        // GET: /BarcodeWriterDemo/

        public ActionResult Index()
        {
            return View();
        }

    }
}
