import { NextResponse } from "next/server";

const footerData = {
    brand: {
        name: "LeaveFlow",
        tagline:    "Effortless leave tracking with seamless approvals.",
        socialLinks: [
            {
                icon: "/images/home/footerSocialIcon/git.png",
                dark_icon: "/images/home/footerSocialIcon/git_dark.png",
                link: "https://github.com/sajid-tech"
            },
            {
                icon: "/images/home/footerSocialIcon/linkedin.svg",
                dark_icon: "/images/home/footerSocialIcon/linkedin_dark.svg",
                link: "https://www.linkedin.com/in/sajid-h-8300a11ab/"
            },
            // {
            //     icon: "/images/home/footerSocialIcon/dribble.svg",
            //     dark_icon: "/images/home/footerSocialIcon/dribble_dark.svg",
            //     link: "https://dribbble.com"
            // },
            // {
            //     icon: "/images/home/footerSocialIcon/instagram.svg",
            //     dark_icon: "/images/home/footerSocialIcon/instagram_dark.svg",
            //     link: "https://instagram.com"
            // }
        ]
    },
    sitemap: {
        name: "Sitemap",
        links: [
            { name: "Contact us", url: "https://github.com/sajid-tech" },
            { name: "About us", url: "https://github.com/sajid-tech" },

          
           
        ]
    },
   
    contactDetails: {
    name: "Contact Details",
    address: "Bengaluru, India",
    email: "sajidhussain189057@gmail.com",
    phone: "+91 9279010410"
  },
  copyright: `©${new Date().getFullYear()} LeaveFlow. All Rights Reserved`
};

export const GET = async () => {
  return NextResponse.json({
    footerData
  });
};