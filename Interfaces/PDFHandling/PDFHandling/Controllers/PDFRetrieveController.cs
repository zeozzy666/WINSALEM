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
using Newtonsoft.Json;

namespace PDFHandling.Controllers
{
    public class PDFRetrieveController : ApiController
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);
        public String GetTrackingIDs(String fileName)
        {
            log.Debug("In Controller gettting list of tracking numbers");
            try
            {
                Utilites.SetLicenseExample();
            }
            catch (Exception ex)
            {
                log.Debug("Getting license threw an error:" + ex.Message);
                return null;
            }
            Utilites.getUSPSDocument(fileName);
            List<String> returnList = Utilites.ProcessDocument(fileName);
            String jsonObj = JsonConvert.SerializeObject(returnList);
            return jsonObj;

            //http://192.168.1.69/api/PDFRetrieve/GetTrackingIDs/toc113020.pdf/1
            //https://de-winston-salem.azurewebsites.net/
            // https://localhost:44359/api/PDFRetrieve/GetTrackingIDs/toc011121.pdf/1
        }

        public String GetFileNamesTrackingID(String fileName, String trackingID)
        {
            log.Debug("In Controller gettting list of tracking numbers");
            try
            {
                Utilites.SetLicenseExample();
            }
            catch (Exception ex)
            {
                log.Debug("Getting license threw an error:" + ex.Message);
                return null;
            }
            Utilites.getUSPSDocument(fileName);
            String[] trackingIDsArray = trackingID.Split(',');
            Dictionary<String, String> returnList = Utilites.GetFileNames(fileName, trackingIDsArray);
            String jsonObj = JsonConvert.SerializeObject(returnList);
            return jsonObj;

            //http://192.168.1.69/api/PDFRetrieve/GetTrackingIDs/toc113020.pdf/1
            //https://de-winston-salem.azurewebsites.net/
            // https://localhost:44359/api/PDFRetrieve/GetFileNamesTrackingID/toc011121.pdf/9171999991703876895663,9171999991703876895700,9171999991703876895793,9171999991703876895656
        }

        public HttpResponseMessage GetConfirmationDocument(String fileName, String trackingID)
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
            
            Utilites.getUSPSDocument(fileName);
            var dataBytes = Utilites.SplitPages(fileName, trackingID);
            //converting Pdf file into bytes array  
            //var dataBytes = File.ReadAllBytes(reqBook);
            //adding bytes to memory stream   
            var dataStream = new MemoryStream(dataBytes);

            HttpResponseMessage httpResponseMessage = Request.CreateResponse(HttpStatusCode.OK);
            httpResponseMessage.Content = new StreamContent(dataStream);
            httpResponseMessage.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment");
            //httpResponseMessage.Content.Headers.ContentDisposition.FileName = bookName;
            httpResponseMessage.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
 
            return httpResponseMessage;


            //pod1130200001.pdf/9171999991703877016760
            //https://192.168.1.75/PDFService/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //http://192.168.1.75/PDFService/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760

            //http://localhost:44359/api/PDFRetrieve/GetConfirmationDocument/pod0111210001.pdf/9171999991703876895663

            //http://localhost/PDFHandling/api/PDFRetrieve/GetConfirmationDocument/pod1130200001.pdf/9171999991703877016760
            //https://winsalem-supp-av.accela.com/portlets/document/adobeDoc.do?mode=download&documentID=24744178&fileKey=A01000000283191E5C3H4W0YE2WE62&source=ADS&edmsType=ADS&haveDownloadRight=yes&refFrom=document&entityID=REC20-00000-003LT&altID=DEM-20-00004&entityType=CAP&module=Enforcement&fileName=7199+9991+7038+7701+6760.pdf
        }
        [System.Web.Http.AcceptVerbs("GET", "POST")]
        public IHttpActionResult DeleteFile(String fileName)
        {
            Utilites.DeleteFiles(fileName);
            return Ok();

            //http://localhost:44359/api/PDFRetrieve/DeleteFile/DETEXTRO.RPT.0102061626/1
            //http://localhost:44359/api/PDFRetrieve/DeleteFile/null/1
        }
    }
}
