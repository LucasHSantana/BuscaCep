import React, { Component } from 'react'

import {
    StatusBar, 
    TextInput,
    View, 
    StyleSheet, 
    Text,     
    Keyboard, 
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Linking} from 'react-native'

import Icon from 'react-native-vector-icons/MaterialIcons'
import { AWS_API_KEY } from '@env'
import api from './services/api'
import Header from './components/Header'

import { AdMobBanner } from "expo-ads-admob";
import Constants from 'expo-constants';

const COLOR_HEADER = '#8c58f0'
const COLOR_CONTENT = '#edb272'

const QTD_ITEMS = 50

const initialState = {    
    error: '',
    text: '',    
    isLoading: false,    
    enderecos: [],
} 

const productionID = "ca-app-pub-1688933571403515/5363144067"
const testID = "ca-app-pub-3940256099942544/6300978111"

export default class Main extends Component{ 
    state = initialState

    constructor(props){
        super(props)        

        this.pagini = 1,
        this.pagfim = QTD_ITEMS,
        this.total = 0,

        this.adUnitID = Constants.isDevice && !__DEV__ ? productionID : testID;                 
    }

    clearState = () => {
        this.setState(initialState) // Retorna o state para os dados iniciais
        this.pagini = 1
        this.pagfim = QTD_ITEMS
        this.total = 0
    }

    onChangeText = (text) => {
        this.setState({text}) // Preenche o state 'text' com o cep ou endereco
    }

    renderLoading = () => {           
        // Se o state estiver marcado como loading, renderiza um componente de loading na tela
        // Senão retorna nulo (não renderiza nada)
        if (this.state.isLoading){
            return(
                <View style={ styles.indicatorContainer }>
                    <ActivityIndicator size='large' color='#9F75F0'/>        
                </View> 
            )        
        } else {
            return null
        }
    }

    getData = async () => {                 
        this.setState({isLoading: true}) // Isto é para colocar um componente de loading na tela

        try {           
            // Preenche o header da requisição
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key':  AWS_API_KEY,
                }
            }

            // corpo da requisição
            const data = {                   
                endereco: this.state['text'], 
                pagini: this.pagini,
                pagfim: this.pagfim,
            }            

            const response = await api.post('/busca_endereco_geral', data, config) // Envia a requisição               
            
            if (!response.data.errorMessage){            
                const retorno = JSON.parse(response.data)

                //Se não retornar erro e estiver com dados retornados preenche o state com os dados
                if (!retorno.erro && retorno.mensagem != 'DADOS NAO ENCONTRADOS'){
                    /*  Faz uma cópia do state dos endereços caso já tenha dados preenchidos
                        Isto é feito para que a lista não seja limpa a cada página consultada,
                        para manter uma lista unica
                    */
                    const enderecos = [...this.state.enderecos] 
                    
                    retorno.dados.forEach(
                        function(endereco){                                                                             
                            enderecos.push({
                                logradouro: endereco.logradouroDNEC,
                                bairro: endereco.bairro,
                                cidade: endereco.localidade,
                                uf: endereco.uf,
                                cep: endereco.cep,
                            }) // Insere o novo endereco na lista
                        }
                    )    

                    this.total = retorno.total,
                    this.pagini = this.pagfim + 1,
                    this.pagfim = this.pagfim + QTD_ITEMS,
                    
                    this.setState({
                        enderecos,                                                
                    }) // Preenche o state com os dados necessários
                } else {
                    this.setState({error: response.data.message})
                }
            } else {
                this.setState({error: `Erro ao realizar a pesquisa: ${response.data.errorMessage}`})
                console.error(`Erro ao realizar a pesquisa: ${response.data.errorMessage}`)
            }

        } catch (err) {
            this.setState({error: `Erro ao realizar a pesquisa: ${err}`})
            console.error(err)
        }

        this.setState({isLoading: false}) // Para remover o componente de loading na tela
    }


    onSearchPress = async () => {   
        /*  Ao apertar o botão de pesquisar irá:
            - Fechar o teclado
            - Limpar o state
            - Realizar a pesquisa
        */                    
        Keyboard.dismiss()

        //Mostra mensagem de erro caso o usuário não preencha o campo    
        if (this.state['text'] === '') {
            this.setState({error: 'Preencha um CEP ou endereço para a consulta!'})            
            return
        }   
        
        this.setState({enderecos: []}) // Retorna o state para os dados iniciais
        this.pagini = 1
        this.pagfim = QTD_ITEMS
        this.total = 0
        
        this.getData()        
    }    

    onEndScroll = () => {
        /*
            Caso ainda tenha mais itens para ser consultados, realiza a consulta
            senão não faz nada
        */
        if (this.pagini >= this.total || this.state.isLoading){            
            return
        } else {            
            this.getData()               
        }
    }

    onClearPress = () => {
        this.setState({text: ''})
    }

    openMap = async (log, cidade, uf) => {        
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${log}, ${cidade}, ${uf}`)
    }

    render(){
        return(
            <View style={styles.container}>                
                { this.renderLoading() }

                <StatusBar backgroundColor={COLOR_HEADER} />

                <Header color_header={COLOR_HEADER} color_content={COLOR_CONTENT} >
                    {/* <Icon name={'menu'} size={30} color='#FFF' style={{marginLeft: 14}}/> */}
                    <Text style={styles.title}>Busca Cep</Text>
                    <View style={styles.textContainer}>
                        <TextInput 
                            // keyboardType='number-pad'
                            style={styles.textInput} 
                            placeholder='CEP ou Endereço'
                            multiline={true}
                            onChangeText={text => this.onChangeText(text)}    
                            value={this.state.text}                    
                        />                        
                        <Icon name='close' size={25} color='#666' style={ styles.clearIcon } onPress={this.onClearPress} />
                        <Icon name='search' size={30} color='#666' style={ styles.searchIcon } onPress={this.onSearchPress}/>                        
                    </View>
                </Header>

            { (this.state.error != '') && <Text style={styles.textError}>{this.state.error}</Text> }


                { (this.state.enderecos.length > 0) &&
                    <FlatList                         
                        onEndReached={this.onEndScroll}
                        data = {this.state.enderecos}
                        keyExtractor = {(item) => item.cep}
                        renderItem = { ({item}) => {
                            return(
                                <TouchableOpacity  key={item.cep} style={[styles.textContainer, styles.resultContainer]} onPress={() => this.openMap(item.logradouro, item.cidade, item.uf)}>
                                    <View style={styles.linha}><Text style={[styles.text, styles.textIni]}>End.: </Text><Text style={styles.text}>{item.logradouro}</Text></View>
                                    <View style={styles.linha}><Text style={[styles.text, styles.textIni]}>Bairro: </Text><Text style={styles.text}>{item.bairro}</Text></View>
                                    <View style={styles.linha}><Text style={[styles.text, styles.textIni]}>Cidade: </Text><Text style={styles.text}>{item.cidade}</Text></View>
                                    <View style={styles.linha}><Text style={[styles.text, styles.textIni]}>UF: </Text><Text style={styles.text}>{item.uf}</Text></View>
                                    <View>
                                        <View style={styles.linha}><Text style={[styles.text, styles.textIni]}>CEP: </Text><Text style={styles.text}>{item.cep}</Text></View>
                                        <Icon name='location-pin' size={30} color='#666' style={ styles.mapIcon }/>
                                    </View>
                                </TouchableOpacity >
                            )
                        }}
                    />
                } 

            <AdMobBanner
                bannerSize="fullBanner"
                adUnitID={this.adUnitID}
                servePersonalizedAds={false}                    
                onDidFailToReceiveAdWithError={(errorCode) => console.log(errorCode)} 
            />   
                
            </View>

        )

    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,        
        backgroundColor: COLOR_CONTENT,         
    },

    textContainer: {              
        padding: 10,                
        backgroundColor: '#FFF',
        borderTopEndRadius: 50,
        borderBottomEndRadius: 50,  
        width: '90%',
        elevation: 10
    },

    text: {
        fontSize: 14        
    },

    textIni: {
        fontWeight: 'bold',
    },

    textInput: {
        color: '#333',
        fontSize: 20
    },

    textSearchButton: {
        color: '#F5FCFF'
    },

    searchButtonContainer: {
        alignItems: 'center',        
    },

    SearchButton: {        
        backgroundColor: '#333',
        alignItems: 'center',
        padding: 10,        
        width: 300,       
        borderRadius: 3,     
        shadowColor: '#EBD943',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 1.0,
        shadowRadius: 3,
        elevation: 5               
    },

    resultContainer: {
        marginVertical: 20
    },

    textError: {        
        color: "red",
        fontSize: 20,
        textAlign: 'center'        
    },

    title: {
        color: '#FFF',
        fontSize: 30,
        marginHorizontal: 15,
        marginBottom: 20
    },

    searchIcon: {
        position: 'absolute',
        top: 10,
        left: '93%',
    },

    clearIcon: {
        position: 'absolute',
        top: 13,
        left: '80%',
    },

    mapIcon: {
        position: 'absolute',
        top: -5,
        left: '85%',
    },

    indicatorContainer: {
        flex: 1, 
        position: 'absolute', 
        width: '100%',
        height: '100%',
        zIndex: 999,                        
        justifyContent: 'center',                        
        backgroundColor: '#88888877',
    },

    linha: {
      flex: 1,
      flexDirection: 'row',  
    }
})