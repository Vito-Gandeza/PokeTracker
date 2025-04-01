import Link from "next/link"
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Collector's Corner Philippines</h3>
            <div className="flex space-x-4 mt-4">
              <Link href="#" className="text-gray-500 hover:text-gray-700">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-700">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-700">
                <Youtube className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-700">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">More Information:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Facebook</p>
                <p className="text-sm">Collector's Corner</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mobile</p>
                <p className="text-sm">0956 697 0848</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Instagram</p>
                <p className="text-sm">CollectorsCornerPhilippines</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Area</p>
                <p className="text-sm">Quezon City, Philippines - Las Piñas, Philippines</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TikTok</p>
                <p className="text-sm">@noel911ttv</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 