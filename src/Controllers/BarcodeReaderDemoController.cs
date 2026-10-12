using Microsoft.AspNetCore.Mvc;

namespace AspNetCoreBarcodeDemo.Controllers
{
    /// <summary>
    /// ASP.NET Core controller for Barcode Reader Demo page.
    /// </summary>
    public class BarcodeReaderDemoController : Controller
    {
        //
        // GET: /BarcodeReaderDemo/

        public ActionResult Index()
        {
            return View();
        }

    }
}
