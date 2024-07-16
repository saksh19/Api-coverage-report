import { useState,useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js';
import './App.css';

// Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const BACKEND_URL = "http://localhost:8087";
function App() {

  const [apiList, setApiList] = useState([]);
  const [file, setFile] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  let   [apiCoverageList,setApiCoverageList]=useState([]);
  const [coverageStats, setCoverageStats] = useState({ covered: 0, notCovered: 0 });
  const [prevdata,setPrevdata]=useState([])
  const [coverageList,setCoverageList]=useState([])
  const [coveredApiEndpoints,setCoveredApiEndpoints]=useState("")
  const [chartData, setChartData] = useState({});
  const [showCharts, setShowCharts] = useState(false);
  const [dbCoveragestats,setDbCoverageStats]=useState([]);
  const [show,setShow]= useState(true)
  const [loader,setLoader]=useState(false)
  let count=1
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    
  };

  const fetchData = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/verify`, { "message": "hello" });
      setPrevdata(res.data);
      console.log("this is a previously stored data------------>",prevdata);
    } catch (error) {
      console.error(error);
    }
  };
  
  useEffect(() => {
    
fetchData();
  }, []);

  useEffect(() => {
    
    let array2 = coverageList
    console.log("coverage list",coverageList);
    let mergedArray = [];

    [prevdata, array2].forEach((array) => {
        array.forEach((obj) => {
            let existingObj = mergedArray.find((o) => o.path === obj.path && o.method===obj.method);
            if (!existingObj) {
                mergedArray.push(obj);
            }
        });
    });

    console.log("this is mergedarray----------------->",mergedArray);

  
    setApiCoverageList(mergedArray);

    console.log("this is a api coverage list--from use effect-->",apiCoverageList);
 
    // <----------------------------------->

    const chartdata = {
      labels: ['Covered', 'Not Covered'],
      datasets: [
        {
          label: '# of APIs',
          data: [coverageStats.covered, coverageStats.notCovered],
          backgroundColor: ['rgba(20, 121, 30, 0.5)', 'rgba(209, 59, 25, 0.5)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1,
        },
      ],
    }
      setChartData(chartdata);

  setShowCharts(true);
      

// <---------------------------------------->

  }, [prevdata,coverageList]);
   
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const formattedEndpoints = res.data.endpoints.map(endpoint => endpoint.split('------')[0]);
      console.log("formated end points",formattedEndpoints);
      setEndpoints(formattedEndpoints);
      // updateCoverageList(apiList, formattedEndpoints);
    } catch (err) {
      console.error(err);
    }
  };


  const swag = async () => {
     
    try {
      const { data } = await axios.get(`${BACKEND_URL}/`);
   
      let CAMS = data.data
      console.log("cams",CAMS.length);
      updateCoverageList(CAMS, endpoints);
     
    } catch (error) {
      console.log("error", error);
    }    
  };
  const chartdata = {
    labels: ['Covered', 'Not Covered'],
    datasets: [
      {
        label: '# of APIs',
        data: [coverageStats.covered, coverageStats.notCovered],
        backgroundColor: ['rgba(20, 121, 30, 0.5)', 'rgba(209, 59, 25, 0.5)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  }

  const dbChartdata = {
    labels: ['Covered', 'Not Covered'],
    datasets: [
      {
        label: '# of APIs',
        data: [dbCoveragestats.covered, dbCoveragestats.notCovered],
        backgroundColor: ['rgba(20, 121, 30, 0.5)', 'rgba(209, 59, 25, 0.5)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  }

  const updateCoverageList = (apis, endpoints) => {
    const coverageList = apis.map(api => ({
      ...api,
      covered: endpoints.includes(api.path)
    }));

    coverageList.sort((a, b) => b.covered - a.covered); // Sort by covered status
    console.log("my coverage list",coverageList);
    setCoveredApiEndpoints(coverageList.filter(api => api.covered))
    setCoverageList(coverageList)
   
  };

  

  const done=()=>{
    swag()
    setShow(false);
    setLoader(true)
     load()
  }

  const load=()=>{
   setTimeout(() => {
    setShow(true);
    setLoader(false);
   }, 4000); 
  }
  useEffect(()=>{
    console.log("this is a api coverage list---->",apiCoverageList);
    console.log("started");
    const covered = apiCoverageList.filter(api => api.covered).length;
    const notCovered = apiCoverageList.length - covered;
    setCoverageStats({ covered, notCovered });
    
  },[apiCoverageList])

useEffect(()=>{
  axios.post(`${BACKEND_URL}/store`,coveredApiEndpoints);
},[coveredApiEndpoints])

// <---------------- Extract stored api -------------->

const check = async () => {
   try {
    const { data } = await axios.get(`${BACKEND_URL}/`)
    let CAMS = data.data;
     await fetchData();
    console.log("cams is", CAMS);
    
     console.log("it is",prevdata);
     const paths=prevdata.map((data)=>{
      return data.path
     })
     console.log("paths are",paths);
    const coverage = CAMS.map(api => ({
      ...api,
      covered: paths.includes(api.path) 
    }));

    let mergedArray = [];

    [prevdata, coverage].forEach((array) => {
      array.forEach((obj) => {
        let existingObj = mergedArray.find((o) => o.path === obj.path && o.method === obj.method);
        if (!existingObj) {
          mergedArray.push(obj);
          
        }
      });
    });
    setApiList(mergedArray)
    
  console.log("db stats are",dbCoveragestats);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
 
};
useEffect(()=>{
  const covered = apiList.filter((arr) => arr.covered).length;
  const notCovered = apiList.length - covered;
  setDbCoverageStats({ covered, notCovered });
},[prevdata,apiList])

// <---------------- Extract stored api -------------->

if(loader){
  return(
    <div class="loader-container">
    <div class="loader">
      <div class="circle"></div>
      <div class="circle"></div>
      <div class="circle"></div>
      <div class="circle"></div>
    </div>
  </div>

  )
}


if(show){
  return (
    <>
      <div className='w-[98vw] overflow-hidden'>
        <div className='flex flex-col'>
          <nav className='bg-slate-700 m-1 h-10 w-full text-center text-white font-bold text-xl rounded-md'>Cams Api automation Covrage report</nav>
          <div className='bg-slate-400 flex justify-evenly'>
            <form onSubmit={handleSubmit}>
              <input type="file" onChange={handleFileChange} />
              <button type="submit" className='bg-blue-600 p-3 rounded-md mt-3 font-semibold'>Upload</button>
            </form>
            <button className='bg-green-500 font-semibold rounded-lg items-end p-3 my-3' onClick={done}>Click to extract Api</button>
            <button className='bg-green-500 font-semibold rounded-lg items-end p-3 my-3' onClick={check}>Click to extract Checked Api</button>
          </div>
        </div>
         {showCharts &&(
        <div className='bg-slate-200 flex justify-center'>
          <div className='h-[400px] border'>
            <h3 className='text-center bg-slate-200 font-semibold'>Api Performance Test Covrage</h3>
            <Pie data={chartdata} />
          </div>
          <div className='h-[400px]'>
            <h3 className='text-center bg-slate-200 font-semibold'>Database Api Test Covrage</h3>
            <Pie data={dbChartdata} />
          </div>
        </div>
)}
        <div>
          <h3 className='text-center font-semibold text-xl bg-slate-200 p-4'>Uploaded API Endpoints:</h3>
          <div className='h-[400px] bg-slate-200 overflow-scroll'>
            <ul>
              {endpoints.map((endpoint, index) => (
                <li className='p-2 m-2 bg-white pl-4 rounded-md border border-white' key={index}>{endpoint}</li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className='text-center font-semibold text-xl bg-slate-200 p-4'>API List with Coverage Status:</h3>
        <div className='h-[400px] bg-slate-200 overflow-scroll m-2'>
          {apiCoverageList.map((api, index) => (
            <div key={index} className={`p-2 m-2 border rounded flex ${api.covered ? 'bg-green-200' : 'bg-red-200'}`}>
              <p className='w-[60vw] text-left'><strong>Path:</strong> {api.path}</p>
              <p className='text-left w-52'><strong>Method:</strong> {api.method}</p>
              <p className='text-right'><strong>Covered:</strong> {api.covered ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>

       
      </div>
    </>
  );
}
}

export default App;
