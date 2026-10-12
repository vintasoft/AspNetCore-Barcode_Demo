using Vintasoft.Shared.Web;

namespace AspNetCoreBarcodeDemo.Controllers
{
    /// <summary>
    /// Response from web controller.
    /// Contains information about the uploaded image file.
    /// </summary>
    public class FileUploadResponseParams : WebImageInfoResponseParams
    {

        /// <summary>
        /// Initializes a new instance of the <see cref="FileUploadResponseParams"/> class.
        /// </summary>
        public FileUploadResponseParams()
        {
        }



        string _base64String;
        /// <summary>
        /// Gets or sets the uploaded image as a Base64 string.
        /// </summary>
        public string base64String
        {
            get { return _base64String; }
            set { _base64String = value; }
        }

    }
}
