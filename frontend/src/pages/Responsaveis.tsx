import { Inventory } from '../components/Inventory'
export const Responsaveis = () => <Inventory title="Responsáveis" endpoint="/responsaveis" columns={['nome','identificacaoFuncional','setor']} fields={[{key:'nome',label:'Nome',required:true},{key:'identificacaoFuncional',label:'Identificação funcional',required:true},{key:'setor',label:'Setor',required:true}]} />
