require "tty-prompt"
require "yaml"

def start()
  prompt = TTY::Prompt.new(help_color: :cyan)

  option = prompt.select("What would you like to do?", [
      {name: 'Quickstart (quorum-examples)', value: 1},
      { name: 'Create Custom Network', value: 2 },
      { name: 'Exit', value: 3 }
  ])


  case option
  when 1
    result = prompt.collect do
      key('numNodes').ask('Number of nodes?', default: '7', in: '1-10')

      key('consensus').select("Consensus?", %w(istanbul raft clique))
      key('deployment').select("How do you want to run this network?", %w(docker-compose kubernetes vagrant bash))
    end
    generate_default(result)
  when 2
    result = prompt.collect do
      key('namespace') do
        key('name').ask('Name of network?', default: 'quorum-test')
      end
      key('nodes') do
        key('number').ask('Number of nodes?', default: '7', in: '1-10')
      end
      key('quorum') do
        consensus = key('consensus').select("Consensus?", %w(istanbul raft clique))

        key('Permissioned_Nodes_File').ask("Permissioned nodes file location?", default: "7nodes/permissioned-nodes.json")
        key('Genesis_File').ask("Genesis file location?", default: "7nodes/istanbul-7nodes/istanbul-genesis.json")
        key('quorum') do
          key('Quorum_Version').select('Quorum version?', %w(2.4.0 2.3.0 2.2.4 2.2.3))
          if consensus == 'raft'
            key('Raft_Port').ask("Raft port?", default: 50401, convert: :int)
          end
        end
        key('tm') do
          key('Tm_Version').select('Tessera version?', %w(0.10.1 0.10.0 0.9.3 0.9.2))
          key('ThirdPartyPort').ask(" 3rd Party port?", default: 9081, convert: :int)
          key('Port').ask("Tessera P2P port?", default: 9001, convert: :int)
        end
      end
      key('geth') do
        key('Node_WSPort').ask("Websocket port?", default: 8546, convert: :int)
        key('NodeP2P_ListenAddr').ask("Node P2P port?", default: 21000, convert: :int)
        key('geth') do
          key('id').ask("Network id?", default: 1101, convert: :int)
          key('public').yes?("Public network?", default: false)
        end
        key('verbosity').ask("Log verbosity?", default: 5, convert: :int, in: '1-5')
      end
    end
    generate(result)
  else
    # exit, do nothing
  end
end

def generate_default(values)
  puts ""
  puts "Generating quorum-examples output for #{values[:deployment]} with a #{values[:numNodes]}-node #{values[:consensus]} network"
end

def generate(values)
  puts ""
  puts values.to_yaml
end

start()
