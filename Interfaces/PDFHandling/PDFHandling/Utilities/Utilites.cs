using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Reflection;
using System.Configuration;
using Aspose.Pdf;
using Aspose.Pdf.Text;
using Aspose.Pdf.Devices;
using System.IO;
using System.Net.Http;
using Newtonsoft.Json;
using PDFHandling.Models;
using System.Net;
using log4net;

namespace PDFHandling.Utilities
{
    public class Utilites
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        //Saves retrieved documents to disc in Documents folder
        public static String getUSPSDocument(String fileName)
        {
            try
            {
                String baseURL = ConfigurationManager.AppSettings["USPSBaseURL"];
                using (var httpClient = new HttpClient())
                {
                    log.Debug("Getting Document from USPS");
                    String listURL = baseURL + "extracts?fullList=true&filename=" + fileName;
                    // String listURL = "https://pdx.usps.com/api/extracts?fullList=true&filename=toc010421.pdf"; // 68034209

                    httpClient.DefaultRequestHeaders.Add("Authorization", ConfigurationManager.AppSettings["USPSBasicAuth"]);
                    string responseList = httpClient.GetStringAsync(new Uri(listURL)).Result;
                    USPSFileList objUSPSFileList = JsonConvert.DeserializeObject<USPSFileList>(responseList);

                    String fileURL = baseURL + "outbound-files/" + objUSPSFileList.outboundFiles[0].id;
                    Stream responseStream = httpClient.GetStreamAsync(new Uri(fileURL)).Result;
                    using (FileStream output = File.OpenWrite(HttpContext.Current.Server.MapPath("/Documents") + "/" + objUSPSFileList.outboundFiles[0].filename))

                    {
                        responseStream.CopyTo(output);

                    }

                }
            }
            catch (Exception ex)
            {
                log.Debug("Application threw an error getting document from USPS:" + ex.Message);
                return null;
            }
            return "";
        }
        public static List<String> ProcessDocument(String fileName)
        {
            try
            {
                // Open document
                Document pdfDocument = new Document(HttpContext.Current.Server.MapPath("/Documents") + "/" + fileName, ConfigurationManager.AppSettings["USPSFilePassword"]);

                //System.Text.RegularExpressions.Regex regex = new System.Text.RegularExpressions.Regex("7199.*?pod1130");
                String fileNameForRegex = fileName.Split('.')[0].Replace("toc", "pod");
                System.Text.RegularExpressions.Regex regex = new System.Text.RegularExpressions.Regex("7199.*?" + fileNameForRegex);
                TextFragmentAbsorber textFragmentAbsorber = new TextFragmentAbsorber(regex); //
                                                                                             // Accept the absorber for all the pages
                pdfDocument.Pages.Accept(textFragmentAbsorber);
                // Get the extracted text fragments
                List<String> trackingNumbers = new List<string>();

                TextFragmentCollection textFragmentCollection = textFragmentAbsorber.TextFragments;
                foreach (TextFragment text in textFragmentCollection)
                {
                    Console.Write(text.Text + " ");
                    String trackingID = "91" + text.Text.Substring(0, 24).Replace(" ", "");
                    trackingNumbers.Add(trackingID);
                   
                }

                return trackingNumbers;
            }
            catch (Exception ex)
            {
                log.Debug("Application threw an error processing document:" + ex.Message);
                return null;
            }
        }

        public static Dictionary<String, String> GetFileNames(String fileName,String[] trackingIDsArray)
        {
            try
            {

                // Open document toc011121
                Document pdfDocument = new Document(HttpContext.Current.Server.MapPath("/Documents") + "/" + fileName, ConfigurationManager.AppSettings["USPSFilePassword"]);

                int count = 0;
                System.Text.RegularExpressions.Regex regex = new System.Text.RegularExpressions.Regex(".*?\n");
                //System.Text.RegularExpressions.Regex regex = new System.Text.RegularExpressions.Regex(trackingNumber + ".*?\n");
                TextFragmentAbsorber textFragmentAbsorber = new TextFragmentAbsorber(regex); //
                                                                                             // Accept the absorber for all the pages
                pdfDocument.Pages.Accept(textFragmentAbsorber);
                // Get the extracted text fragments
                Dictionary<String, String> trackingNumbers = new Dictionary<String, String>();

                

                TextFragmentCollection textFragmentCollection = textFragmentAbsorber.TextFragments;
                
                foreach (TextFragment text in textFragmentCollection)
                {
                    
                    Console.Write(text.Text + " ");
                    //7199 9991 7038 7689 5649 12/29/2020 at 03:24 pm pod0104210001
                    if (!text.Text.Contains("pod"))
                    {
                        continue;
                    }
                    String trackID = "91" + text.Text.Substring(0, 24).Replace(" ", "");
                    
                    if (trackingIDsArray.Contains(trackID)) {

                        String currentFileName = text.Text.Substring(text.Text.IndexOf("pod"));
                        trackingNumbers.Add(trackID, currentFileName);
                        count++;
                    }
                    if (count == trackingIDsArray.Length)
                    {
                        break;
                    }

                    //7199 9991 7038 7701 6760 11/23/2020 at 08:03 am pod1130
                    //9171999991703877016760
                    //7199 9991 7039 3496 8445
                    //9171999991703934968445
                }


                return trackingNumbers;
            }
            catch (Exception ex)
            {
                log.Debug("Application threw an error processing document:" + ex.Message);
                return null;
            }
        }

        //public String fileNameToReturn = "";
        public static HttpResponseMessage SplitPages(String fileName, String trackingID, HttpRequestMessage request, HttpResponse response)
        {
            String trackimgIDToSearch = trackingID.Substring(2);
            trackimgIDToSearch = trackimgIDToSearch.Substring(0, 4) + " " + trackimgIDToSearch.Substring(4, 4) + " " + trackimgIDToSearch.Substring(8, 4) + " " + trackimgIDToSearch.Substring(12, 4) + " " + trackimgIDToSearch.Substring(16, 4);

            log.Debug("Gettting document from file system");
            try
            {
                // Open document
                //Document pdfDocument = new Document("C:/Temp" + "/" + fileName, "PH6M8K");
                Document pdfDocument = new Document(HttpContext.Current.Server.MapPath("/Documents") + "/" + fileName, ConfigurationManager.AppSettings["USPSFilePassword"]);

                // Loop through all the pages
                foreach (Page pdfPage in pdfDocument.Pages)
                {
                    String extractedText = "";
                    using (MemoryStream textStream = new MemoryStream())
                    {
                        // Create text device
                        TextDevice textDevice = new TextDevice();

                        // Set different options
                        TextExtractionOptions options = new
                        TextExtractionOptions(TextExtractionOptions.TextFormattingMode.Raw);
                        textDevice.ExtractionOptions = options;

                        // Convert the page and save text to the stream
                        textDevice.Process(pdfPage, textStream);

                        // Close memory streamPH
                        textStream.Close();

                        // Get text from memory stream
                        extractedText = Encoding.Unicode.GetString(textStream.ToArray());
                        //extractedText.Contains("")
                    }
                    if (extractedText.Contains(trackimgIDToSearch))
                    {
                        Document newDocument = new Document();
                        newDocument.Pages.Add(pdfPage);
                        //newDocument.Save("C:/Temp" + "/" + trackimgIDToSearch + ".pdf");
                        newDocument.Save(HttpContext.Current.Server.MapPath("/Documents") + "/" + trackimgIDToSearch + ".pdf");
                        //"C:/Temp" + "/" + 
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                log.Debug("Application threw an error getting document:" + ex.Message);
            }
            try
            {
                

                
                HttpResponseMessage httpResponseMessage = request.CreateResponse(HttpStatusCode.OK);
                //httpResponseMessage.Content = new StreamContent(dataStream);
                var dataBytes = File.ReadAllBytes(HttpContext.Current.Server.MapPath("/Documents") + "/" + trackimgIDToSearch + ".pdf");
                //var dataStream = new MemoryStream();
                var dataStream = new MemoryStream(dataBytes);
               // var gZipStream = new System.IO.Compression.GZipStream(dataStream, System.IO.Compression.CompressionMode.Compress);
                //httpResponseMessage.Content = new StreamContent(gZipStream);
                //using (var outputStream = new MemoryStream())
                ////{
                //using (var gZipStream = new System.IO.Compression.GZipStream(dataStream, System.IO.Compression.CompressionMode.Compress))
                //{
                //    gZipStream.Write(dataBytes, 0, dataBytes.Length);

                    
                //}
                httpResponseMessage.Content = new StreamContent(dataStream);
                //}

                //httpResponseMessage.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("inline");
                httpResponseMessage.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment");
                httpResponseMessage.Content.Headers.ContentDisposition.FileName = trackimgIDToSearch + ".pdf";
                httpResponseMessage.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
                //log.Debug(httpResponseMessage.Content.Headers.ContentEncoding);
                //response.Filter = new System.IO.Compression.GZipStream(response.Filter,
                //                        System.IO.Compression.CompressionMode.Compress);
                //response.Headers.Remove("Content-Encoding");
                //response.AppendHeader("Content-Encoding", "gzip");
                //response.AppendHeader("Vary", "Content-Encoding");
                //response.AppendHeader("Transfer-Encoding", "chunked");
                //response.Headers.Remove("Content-Type");
                //response.AppendHeader("Content-Type", "application/octet-stream");
                //response.
                //response.WriteFile(HttpContext.Current.Server.MapPath("/Documents") + "/" + trackimgIDToSearch + ".pdf");
                //httpResponseMessage.
                //httpResponseMessage..
                httpResponseMessage.Headers.Add("Vary", "Accept-Encoding");
                httpResponseMessage.Headers.Add("Keep-Alive", " timeout=15, max=99");
                httpResponseMessage.Headers.Add("Connection", "Keep-Alive");
                httpResponseMessage.Headers.Add("Transfer-Encoding", "chunked");
                httpResponseMessage.Content.Headers.Add("Content-Encoding", "gzip");
                httpResponseMessage.Content.Headers.Add("Content-Language", "en-US");
                return httpResponseMessage;
            }
            catch (Exception ex)
            {
                log.Debug("Application threw an error returning document:" + ex.Message);
                return null;
            }


            // return "done";
        }

        public static void DeleteFiles(String fileName)
        {
            try
            {
                if (fileName == "null")
                {
                    string[] filePaths = Directory.GetFiles(HttpContext.Current.Server.MapPath("/Documents"));
                    foreach (string filePath in filePaths)
                    {
                        if (filePath.Contains("folder.js"))
                        {
                            continue;
                        }
                        File.Delete(filePath);
                    }
                }
                else
                {
                    File.Delete(HttpContext.Current.Server.MapPath("/Documents/") + fileName);
                }
            }
            catch (Exception ex)
            {
                log.Debug("Error deleting file:" + ex.Message);
            }
        }
        public static void SetLicenseExample()
        {
            // Initialize license object
            Aspose.Pdf.License license = new Aspose.Pdf.License();
            try
            {
                // Set license
                license.SetLicense("Aspose.Total.NET.lic");
            }
            catch (Exception)
            {
                // something went wrong
                throw;
            }
            Console.WriteLine("License set successfully.");
        }

        //Function not used. Saved as future reference
        public static String GetTable()
        {
            Document pdfDocument = new Document("C:/Users/mwells/source/repos/PDFHandling/PDFHandling/Utilities/toc122120 (1).pdf", "PH6M8K");
            TableAbsorber absorber = new TableAbsorber();

            PageCollection pc = pdfDocument.Pages;
            foreach (Page pg in pc)
            {

                absorber.Visit(pg);

                foreach (AbsorbedTable table in absorber.TableList)

                {

                    foreach (AbsorbedRow row in table.RowList)

                    {


                        foreach (AbsorbedCell cell in row.CellList)

                        {

                            foreach (TextFragment text in cell.TextFragments)

                            {

                                Console.Write(text.Text + " ");

                            }

                            Console.Write("|");

                        }

                        Console.WriteLine("-------------------------------------------");

                    }

                    Console.WriteLine("===========================================");

                }


            }
            return "";
        }
    }
}