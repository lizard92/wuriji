import { useState, useEffect, type FormEvent } from 'react'
import DateInput from './DateInput'
import { todayString } from '../utils/dateInput'
import type { Member } from '../types'

interface ItemFormProps {
  members: Member[]
  defaultOwnerId: string
  onAdd: (item: {
    name: string
    price: number
    purchaseDate: string
    ownerId: string
  }) => void
}

export default function ItemForm({ members, defaultOwnerId, onAdd }: ItemFormProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayString)
  const [ownerId, setOwnerId] = useState(defaultOwnerId)

  useEffect(() => {
    if (defaultOwnerId) setOwnerId(defaultOwnerId)
  }, [defaultOwnerId])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedPrice = parseFloat(price)
    if (!name.trim() || !parsedPrice || parsedPrice <= 0 || !purchaseDate || !ownerId) return
    if (purchaseDate > todayString()) {
      window.alert('购买日期不能晚于今天')
      return
    }
    onAdd({ name: name.trim(), price: parsedPrice, purchaseDate, ownerId })
    setName('')
    setPrice('')
  }

  return (
    <div className="form-card">
      <h2>添加物品</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="full">
            <label htmlFor="name">物品名称</label>
            <input
              id="name"
              placeholder="例如：iPhone 15"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="owner">归属人</label>
            <select
              id="owner"
              className="form-select"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              required
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price">购买价格（元）</label>
            <input
              id="price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="5000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="full">
            <label>购买日期（年月日）</label>
            <DateInput
              value={purchaseDate}
              onChange={setPurchaseDate}
              max={todayString()}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          添加
        </button>
      </form>
    </div>
  )
}
