using Microsoft.AspNetCore.Mvc;

namespace AspNetCoreBarcodeDemo.Controllers
{
    /// <summary>
    /// ASP.NET Core controller for Home page.
    /// </summary>
    public class HomeController : Controller
    {
        //
        // GET: /Index/

        public ActionResult Index()
        {
            return View();
        }
    }
}
