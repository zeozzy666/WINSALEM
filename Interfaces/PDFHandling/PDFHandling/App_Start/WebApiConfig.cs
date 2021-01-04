using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace PDFHandling
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}/{fileName}/{trackingID}",
                defaults: new { fileName = RouteParameter.Optional, trackingID = RouteParameter.Optional}
            );
            //config.Routes.MapHttpRoute(
            //    name: "GetDocApi",
            //    routeTemplate: "api/{controller}/{action}/{fileName}",
            //    defaults: new { fileName = RouteParameter.Optional }
            //);
        }
    }
}
