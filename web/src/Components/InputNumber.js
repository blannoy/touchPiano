import React, { useState, useEffect } from "react"
import "../assets/css/inputnumber.css"

function InputNumber(
  { id, steps, inputValue, min = 0, max = 10, cycle = false, onChange } = {
    id: "input",
    inputValue: 0,
    steps: 1,
    min: 0,
    max: 10,
    cycle: false
  }
) {
  const [value, setValue] = useState(inputValue)
  const [mouseDownDirection, setMouseDownDirection] = React.useState(undefined)
  const maxDigits = num => (num < 0 ? 4 : 3)

  const handleChange = ({ currentTarget: { value } }) => {
    setValue(curr => {
      if (!Boolean(value)) {
        return 0
      }
      let numeric = parseInt(value, 10)
      const maxLength = maxDigits(numeric)
      if (numeric > max) {
        numeric = cycle ? min : max
      }
      if (numeric < min) {
        numeric = cycle ? max : min
      }
      if (value.length > maxLength) {
        return curr
      }

      return value.length <= maxLength ? numeric : curr
    })
  }

  const handleButtonChange = direction => {
    setValue(curr => {
      let next

      switch (direction) {
        case "up":
          next = curr + (steps || 1)
          if (next > max) {
            next = cycle ? min : max
          }
          break
        case "down":
          next = curr - (steps || 1)
          if (next < min) {
            next = cycle ? max : min
          }
          break
        default:
          next = curr
          break
      }

      return `${next}`.length <= maxDigits(curr) ? next : curr
    })
  }

  const handleScrollChange = event => {
    let delta = event.nativeEvent.wheelDelta
    if (delta > 0) {
      handleButtonChange("up")
    } else if (delta < 0) {
      handleButtonChange("down")
    }
  }

  useEffect(() => {
    onChange && onChange(id, value)
  }, [value])

  return (
    <div className="input-number">
      <button onClick={() => handleButtonChange("up")}>+</button>
      <input
        type="number"
        id={id}
        step={steps}
        value={value}
        onChange={handleChange}
        onWheel={handleScrollChange}
      />
      <button onClick={() => handleButtonChange("down")}>-</button>
    </div>
  )
}

export default React.memo(InputNumber)
