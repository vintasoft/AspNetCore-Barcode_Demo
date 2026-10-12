using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Vintasoft.Barcode;

namespace AspNetCoreBarcodeDemo.Controllers
{
    /// <summary>
    /// ASP.NET Core controller for Camera Barcode Reader Demo page.
    /// </summary>
    public class CameraBarcodeReaderDemoController : Controller
    {
        public ActionResult Index()
        {
            ViewData["BarcodeTypes"] = GetBarcodeTypes();
            return View();
        }



        /// <summary>
        /// Returns the supported barcode types.
        /// </summary>
        /// <returns></returns>
        private static List<SelectListItem> GetBarcodeTypes()
        {
            List<SelectListItem> list = new List<SelectListItem>();

            BarcodeType[] barcodeTypes = new BarcodeType[]{
                BarcodeType.Aztec | BarcodeType.DataMatrix | BarcodeType.QR | BarcodeType.PDF417 | BarcodeType.PDF417Compact,
                BarcodeType.Code39 | BarcodeType.Code128 | BarcodeType.EAN13 | BarcodeType.UPCA | BarcodeType.UPCE,
                BarcodeType.Aztec,
                BarcodeType.DataMatrix,
                BarcodeType.QR,
                BarcodeType.MicroQR,
                BarcodeType.HanXinCode,
                BarcodeType.PDF417 | BarcodeType.PDF417Compact,
                BarcodeType.MicroPDF417,
                BarcodeType.MaxiCode,
                BarcodeType.DotCode,
                BarcodeType.Code16K,
                BarcodeType.IATA2of5,
                BarcodeType.Matrix2of5,
                BarcodeType.Code11,
                BarcodeType.Codabar,
                BarcodeType.Code128,
                BarcodeType.Code39,
                BarcodeType.Code93,
                BarcodeType.EAN13,
                BarcodeType.EAN13Plus2,
                BarcodeType.EAN13Plus5,
                BarcodeType.EAN8,
                BarcodeType.UPCA,
                BarcodeType.UPCE,
                BarcodeType.Interleaved2of5,
                BarcodeType.Standard2of5,
                BarcodeType.MSI,
                BarcodeType.Pharmacode,
                BarcodeType.RSS14,
                BarcodeType.RSSExpanded,
                BarcodeType.RSSLimited,
                BarcodeType.Telepen,
                BarcodeType.AustralianPost,
                BarcodeType.IntelligentMail,
                BarcodeType.RoyalMail,
                BarcodeType.Planet,
                BarcodeType.Postnet,
                BarcodeType.Mailmark4StateC,
                BarcodeType.Mailmark4StateL,
                BarcodeType.JapanPost
            };
            for (int i = 0; i < barcodeTypes.Length; i++)
            {
                SelectListItem item = new SelectListItem();
                item.Text = barcodeTypes[i].ToString();
                item.Value = ((long)barcodeTypes[i]).ToString();
                list.Add(item);
            }

            List<string> subsets1D = Get1DBarcodeSubsets();
            SelectListGroup selectList1DGroup = new SelectListGroup();
            selectList1DGroup.Name = "1DSubsets";
            for (int i = 0; i < subsets1D.Count; i++)
            {
                SelectListItem item = new SelectListItem();

                item.Text = subsets1D[i];
                item.Value = subsets1D[i];
                item.Group = selectList1DGroup;

                list.Add(item);
            }

            List<string> subsets2D = Get2DBarcodeSubsets();
            SelectListGroup selectList2DGroup = new SelectListGroup();
            selectList2DGroup.Name = "2DSubsets";
            for (int i = 0; i < subsets2D.Count; i++)
            {
                SelectListItem item = new SelectListItem();

                item.Text = subsets2D[i];
                item.Value = subsets2D[i];
                item.Group = selectList2DGroup;

                list.Add(item);
            }

            return list;
        }

        /// <summary>
        /// Returns the supported 1D barcode subsets.
        /// </summary>
        /// <returns></returns>
        private static List<string> Get1DBarcodeSubsets()
        {
            List<string> subsets = new List<string>()
            {
                "Code32",
                "Code39Extended",
                "EANVelocity",
                "GS1DataBarLimited",
                "ISBN",
                "ISBNPlus2",
                "ISBNPlus5",
                "ISMN",
                "ISMNPlus2",
                "ISMNPlus5",
                "ISSN",
                "ISSNPlus2",
                "ISSNPlus5",
                "JAN13",
                "JAN13Plus2",
                "JAN13Plus5",
                "JAN8",
                "JAN8Plus2",
                "JAN8Plus5",
                "NumlyNumber"
            };

            if (!BarcodeGlobalSettings.IsDemoVersion)
            {
                subsets.Add("OPC");
                subsets.Add("VIN");
                subsets.Add("SSCC18");
                subsets.Add("SwissPostParcel");
                subsets.Add("VicsBol");
                subsets.Add("VicsScacPro");
                subsets.Add("ITF14");
                subsets.Add("ItalianPost2of5");
                subsets.Add("FedExGround96");
                subsets.Add("DhlAwb");
                subsets.Add("DeutschePostIdentcode");
                subsets.Add("DeutschePostLeitcode");
                subsets.Add("GS1_128");
                subsets.Add("GS1DataBar");
                subsets.Add("GS1DataBarStacked");
                subsets.Add("GS1DataBarExpanded");
                subsets.Add("GS1DataBarExpandedStacked");
                subsets.Add("GS1DataBarLimited");
                subsets.Add("PZN");
            }
            return subsets;
        }

        /// <summary>
        /// Returns the supported 2D barcode subsets.
        /// </summary>
        /// <returns></returns>
        private static List<string> Get2DBarcodeSubsets()
        {
            List<string> subsets = new List<string>();
            if (!BarcodeGlobalSettings.IsDemoVersion)
            {
                subsets.Add("GS1QR");
                subsets.Add("GS1Aztec");
                subsets.Add("GS1DataMatrix");
                subsets.Add("GS1DotCode");
                subsets.Add("MailmarkCmdmType7");
                subsets.Add("MailmarkCmdmType9");
                subsets.Add("MailmarkCmdmType29");
                subsets.Add("PPN");
                subsets.Add("XFACompressedAztec");
                subsets.Add("XFACompressedDataMatrix");
                subsets.Add("XFACompressedPDF417");
                subsets.Add("XFACompressedQRCode");
            }
            return subsets;
        }

    }
}