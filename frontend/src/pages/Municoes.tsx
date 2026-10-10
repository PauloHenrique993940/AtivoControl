import { Inventory } from '../components/Inventory'
export const Municoes = () => <Inventory title="Munições" endpoint="/municoes" columns={['tipo','calibre','quantidade']} fields={[{key:'tipo',label:'Tipo',required:true},{key:'calibre',label:'Calibre',required:true},{key:'quantidade',label:'Quantidade em estoque',type:'number',required:true,initial:0}]} />
