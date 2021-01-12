using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Reflection;
using PDFHandling.Models;
using PDFHandling.Utilities;
using System.IO;
using log4net;

namespace PDFHandling.Controllers
{
    public class PDFRetrieveController : ApiController
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);
        public List<String> GetTrackingIDs(String fileName)
        {
            log.Debug("In Controller gettting list of tracking numbers");
            Utilites.SetLicenseExample();
            Utilites.getUSPSDocument(fileName);
            List<String> returnList = Utilites.ProcessDocument(fileName);
            return returnList;
            //http://192.168.1.69/api/PDFRetrieve/GetTrackingIDs/toc113020.pdf/1
            //https://de-winston-salem.azurewebsites.net/
        }

        public byte[] GetConfirmationDocument(String fileName, String trackingID)
        {
            log.Debug("In Controller gettting document");
            try
            {
                Utilites.SetLicenseExample();
            }
            catch (Exception ex)
            {
                log.Debug("Getting license threw an error:" + ex.Message);
                return null;
            }
            
            //Utilites.getUSPSDocument(fileName);
            return Utilites.SplitPages(fileName, trackingID);
            //pod1130200001.pdf/9171999991703877016760
            //https://192.168.1.75/PDFService/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //http://192.168.1.75/PDFService/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //http://localhost:44359/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //http://localhost/PDFHandling/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //https://winsalem-supp-av.accela.com/portlets/document/adobeDoc.do?mode=download&documentID=24744178&fileKey=A01000000283191E5C3H4W0YE2WE62&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=REC20-00000-003LT&altID=DEM-20-00004&entityType=CAP&module=Enforcement&fileName=7199+9991+7038+7701+6760.pdf
        }
    }
}
