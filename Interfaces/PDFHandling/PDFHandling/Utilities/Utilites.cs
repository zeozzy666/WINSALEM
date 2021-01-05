using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Reflection;
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
        public static String getUSPSDocument(String fileName)
        {
            using (var httpClient = new HttpClient())
            {
                log.Debug("Getting Document from USPS");
                String listURL = "https://pdx.usps.com/api/extracts?fullList=true&filename=" + fileName;
                // String listURL = "https://pdx.usps.com/api/extracts?fullList=true&filename=toc113020.pdf"; 
                //String url = "https://pdx.usps.com/api/extracts?fullList=true&fileType=BPOD";

                httpClient.DefaultRequestHeaders.Add("Authorization", "Basic Y293c2NiZDpDaXR5b2ZXaW5zdG9uIzE =");
                string responseList = httpClient.GetStringAsync(new Uri(listURL)).Result;
                USPSFileList objUSPSFileList = JsonConvert.DeserializeObject<USPSFileList>(responseList);

                String fileURL = "https://pdx.usps.com/api/outbound-files/" + objUSPSFileList.outboundFiles[0].id;
                Stream responseStream = httpClient.GetStreamAsync(new Uri(fileURL)).Result;
                using (FileStream output = File.OpenWrite(HttpContext.Current.Server.MapPath("/Documents") + "/" + objUSPSFileList.outboundFiles[0].filename))
                //using (FileStream output = File.OpenWrite("C:/Temp" + "/" + objUSPSFileList.outboundFiles[0].filename))
                {
                    responseStream.CopyTo(output);

                }


                //USPSFileList objUSPSFileList = JsonConvert.DeserializeObject<USPSFileList>(response);
            }
            return "";
        }
        public static List<String> ProcessDocument(String fileName)
        {
            //getUSPSDocument(fileName);
            // Open document
            //HttpContext.Current.Server.MapPath("/Utilities") +
            Document pdfDocument = new Document(HttpContext.Current.Server.MapPath("/Documents") + "/" + fileName, "PH6M8K");
            //Document pdfDocument = new Document("C:/Temp" + "/" + fileName, "PH6M8K");

            System.Text.RegularExpressions.Regex regex = new System.Text.RegularExpressions.Regex("7199.*?pod1130");
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
                //7199 9991 7038 7701 6760 11/23/2020 at 08:03 am pod1130
                //9171999991703877016760
                //7199 9991 7039 3496 8445
                //9171999991703934968445
            }

            return trackingNumbers;
            //StringBuilder builder = new StringBuilder();
            //// String to hold extracted text
            //string extractedText = "";

            //foreach (Page pdfPage in pdfDocument.Pages)
            //{
            //    using (MemoryStream textStream = new MemoryStream())
            //    {
            //        // Create text device
            //        TextDevice textDevice = new TextDevice();

            //        // Set different options
            //        TextExtractionOptions options = new
            //        TextExtractionOptions(TextExtractionOptions.TextFormattingMode.Raw);
            //        textDevice.ExtractionOptions = options;

            //        // Convert the page and save text to the stream
            //        textDevice.Process(pdfPage, textStream);

            //        // Close memory stream
            //        textStream.Close();

            //        // Get text from memory stream
            //        extractedText = Encoding.Unicode.GetString(textStream.ToArray());
            //        //extractedText.Contains("")
            //    }
            //    builder.Append(extractedText);
            //}

            ////dataDir = dataDir + "PDF_to_TXT_Raw.txt";
            //// Save the text file
            ////File.WriteAllText(dataDir, builder.ToString());
            //String g = builder.ToString();
            //Array arr = g.ToArray();
            //return builder.ToString();
        }

     
        public static byte[] SplitPages(String fileName, String trackingID)
        {
            String trackimgIDToSearch = trackingID.Substring(2);
            trackimgIDToSearch = trackimgIDToSearch.Substring(0, 4) + " " + trackimgIDToSearch.Substring(4, 4) + " " + trackimgIDToSearch.Substring(8, 4) + " " + trackimgIDToSearch.Substring(12, 4) + " " + trackimgIDToSearch.Substring(16, 4);

            log.Debug("Gettting document from file system");
            try
            {
                // Open document
                //Document pdfDocument = new Document("C:/Temp" + "/" + fileName, "PH6M8K");
                Document pdfDocument = new Document(HttpContext.Current.Server.MapPath("/Documents") + "/" + fileName, "PH6M8K");

                int pageCount = 1;

                // Loop through all the pages
                foreach (Page pdfPage in pdfDocument.Pages)
                {
                    //if (pageCount == 2)
                    //{
                    //    break;
                    //}
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

                    pageCount++;
                }
            }
            catch (Exception ex)
            {
                log.Debug("Application threw an error getting document:" + ex.Message);
            }
            try
            {
                using (FileStream SourceStream = File.Open(HttpContext.Current.Server.MapPath("/Documents") + "/" + trackimgIDToSearch + ".pdf", FileMode.OpenOrCreate))
                //using (FileStream SourceStream = File.Open("C:/Temp" + "/" + trackimgIDToSearch + ".pdf", FileMode.OpenOrCreate))
                {
                    //SourceStream.Seek(0, SeekOrigin.End);
                    //await SourceStream.WriteAsync(result, 0, result.Length);
                    using (var memoryStream = new MemoryStream())
                    {
                        SourceStream.CopyTo(memoryStream);
                        return memoryStream.ToArray();
                    }

                }
            }
            catch (Exception ex)
            {
                log.Debug("Application threw an error returning document:" + ex.Message);
                return null;
            }


           // return "done";
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