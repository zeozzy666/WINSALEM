using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PDFHandling.Models
{
        // Root myDeserializedClass = JsonConvert.DeserializeObject<Root>(myJsonResponse); 
        public class OutboundFile
        {
            public int id { get; set; }
            public string environment { get; set; }
            public string createdTime { get; set; }
            public string filename { get; set; }
            public string downloadTime { get; set; }
            public string fileSize { get; set; }
            public string mid { get; set; }
        }

        public class USPSFileList
        {
            public List<OutboundFile> outboundFiles { get; set; }
            public int totalResults { get; set; }
            public int pageNumber { get; set; }
            public int pageSize { get; set; }
        }
}