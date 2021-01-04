using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using PDFHandling.Models;
using PDFHandling.Utilities;
using System.IO;

namespace PDFHandling.Controllers
{
    public class PDFRetrieveController : ApiController
    {
        public List<String> GetTrackingIDs(String fileName)
        {
            Utilites.SetLicenseExample();
            Utilites.getUSPSDocument(fileName);
            List<String> returnList = Utilites.ProcessDocument(fileName);
            return returnList;
            //http://192.168.1.69/api/PDFRetrieve/GetTrackingIDs/toc113020.pdf
        }

        public byte[] GetConfirmationDocument(String fileName, String trackingID)
        {
            Utilites.SetLicenseExample();
            //Utilites.getUSPSDocument(fileName);
            return Utilites.SplitPages(fileName, trackingID);
            //pod1130200001.pdf/9171999991703877016760
            //https://192.168.1.75/PDFService/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //http://192.168.1.75/PDFService/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //http://localhost:44359/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //http://localhost/PDFHandling/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
        }
    }
}
