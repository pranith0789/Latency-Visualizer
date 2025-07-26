# 🌐 Latency Topology Visualizer

The **Latency Topology Visualizer** is an interactive web application that displays real-time latency data between global cloud regions (AWS, GCP, Azure)and crypto exchange platforms on a 3D globe. It uses the **Globalping API** to fetch latency measurements and visually maps them using WebGL and Three.js. This tool helps users monitor, compare, and analyze network latency across multiple providers and geographic regions.

---

## 🔧 Tech Stack

- **Frontend Framework**: Next.js 14 (App Router, Client/Server Components)
- **Rendering Engine**: Three.js with `react-three-fiber`
- **3D Globe UI**: `three-globe` + D3
- **Icons & UI Elements**: Lucide Icons, Tailwind CSS
- **API Integration**: Globalping API (https://globalping.io)

---

## 🚀 How to Run the Project Locally

### 1. Clone the Repository


git clone https://github.com/your-username/latency-topology-visualizer.git
cd latency-topology-visualizer
2. Install Dependencies
npm install
3. Configure Environment Variables
Create a .env.local file in the root directory and add your Globalping API key:
GLOBALPING_API_KEY=your_globalping_api_key_here
4. Start the Development Server
npm run dev
Now open http://localhost:3000 in your browser to view the application.

📦 Libraries Used
Library	Purpose
three	Low-level 3D rendering
react-three-fiber	React renderer for Three.js
three-globe	3D globe rendering with arcs, rings, and custom data points
lucide-react	Feather-style icon set
d3-geo	Geo coordinate calculations for arc paths
tailwindcss	Utility-first CSS framework
next-themes	Theme switching (Dark/Light mode)
@react-three/drei	Useful helpers for working with react-three-fiber
axios	For making HTTP requests to the Globalping API

📜 Project Features
🌐 3D interactive globe with real-time latency arcs

🔍 Provider & region-based filtering (AWS, GCP, Azure)

🌗 Dark/light mode toggle

📈 Latency heat coloring (Green: low, Yellow: medium, Red: high)

🧭 Location markers with hover tooltips

🔎 Search functionality for quick region lookup

🧮 Table view of latency results with sorting and export support

📌 Assumptions
Users will provide a valid Globalping API Key via .env.local.

The app assumes a stable internet connection to fetch measurement data.

The number of simultaneous measurements respects the Globalping API rate limit.

The frontend is expected to run on modern browsers that support WebGL.

📽️ Demo
You can view a video demo of this project here
(https://drive.google.com/file/d/1QpzzQuaj-gcl6OWMCdvBBtXVbqaYEedY/view?usp=sharing)

📂 Folder Structure (Optional)
graphql
Copy
Edit
latency-topology-visualizer/
├── app/                     # Next.js App Router pages
│   ├── components/          # UI Components (globe, filters, modals)
│   └── layout.tsx           # Root layout
├── public/                  # Static assets
├── styles/                 # Global Tailwind CSS styles
├── .env.local               # API key environment config
├── package.json             # Project metadata and scripts
└── README.md
📬 Contact
For any queries or issues, please reach out via GitHub Issues or email me at podduturi0789@gmail.com.
