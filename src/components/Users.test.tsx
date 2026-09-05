import { render, screen } from "@testing-library/react"
import Users from "./Users"
import userEvent from "@testing-library/user-event"
import { server } from "./__fixtures__/server"
import { http, HttpResponse } from "msw"
// import { server } from "./__fixtures__/server"

describe('mock the calls using jest fn and msw',()=>{
    it('loading', async()=>{
        render(<Users fetchUsers={jest.fn(()=> new Promise<string[]>(()=>[]))} />)

        expect(screen.getByRole('status')).toHaveTextContent('Loading...')
    })

    it('success',async()=>{
        // const prom = new Promise<string[]>(()=>["Ada", "Grace"])
        // const fetchusers = jest.fn(()=> prom.then())
        // render(<Users fetchUsers={prom.then()} />)

        const fetchUsers = jest.fn().mockResolvedValue(['Ada', 'Grace']);
        render(<Users fetchUsers={fetchUsers} />);

        expect(await screen.findByRole('list',{name: 'Users'})).toBeInTheDocument()
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
        expect(fetchUsers).toHaveBeenCalledTimes(1)
    })

    it('empty',async()=>{
        const fetchusers = jest.fn().mockResolvedValue([])
        render(<Users fetchUsers={fetchusers} />);

        expect(await screen.findByRole('paragraph')).toHaveTextContent("No users yet.")
    })

    it('error then retry works', async()=>{
        const user = userEvent.setup()
        const fetchusers = jest.fn().mockRejectedValueOnce(new Error('booom')).mockResolvedValue(['Ada']); 

        render(<Users fetchUsers={fetchusers} />);

        expect(await screen.findByRole('alert')).toBeInTheDocument()

        user.click(screen.getByRole('button'))

        expect(await screen.findByRole('list')).toBeInTheDocument()
    })
})


describe("testing by mock service worcker",()=>{
    it('renders users from the api', async()=>{
        render(<Users />)

        expect(await screen.findByRole('list',{name:'Users'})).toBeInTheDocument()
    })

    it('shows and eror when the api fails',async()=>{
        server.use(http.get('/api/users', ()=> new HttpResponse(null,{status:500})))

        render(<Users/>)

        expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
})