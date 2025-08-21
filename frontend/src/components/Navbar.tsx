import { Link } from "react-router-dom"
import { Button } from "./ui/button"

const Navbar = () => {
    return (
        <nav>
          <div className="w-screen flex justify-center items-center space-x-4">
            <Button asChild variant="ghost">
              <Link to="/home">Home</Link>
            </Button>
          </div>
        </nav>
      
    );

}

export default Navbar