import './Debug.css'

export default function Debug({ setTemp, tempInside, setTempInside, tempOutside, setTempOutside }) {
  return (
    <div className='debug_div'>
      <button onClick={() => setTemp(tempInside, setTempInside, 26.26)}>
        SetTempIn
      </button>
      <p>TempInside</p><input type="number" value={tempInside} onChange={(e) => setTempInside(Number(e.target.value))} />
      <p>TempOutside</p><input type="number" value={tempOutside} onChange={(e) => setTempOutside(Number(e.target.value))} />
    </div>
  )
}