using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PDFHandling.Models
{
    public class PDFDocument
    {
        String text;
        public String Text
        {
            get { return text;}
            set { text = value; }
        }
    }
}