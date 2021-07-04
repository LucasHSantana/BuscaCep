import React, { Component } from 'react'

import {
    StatusBar, 
    TextInput,
    View, 
    StyleSheet, 
    Text,     
    Keyboard, 
    ActivityIndicator,
    FlatList} from 'react-native'

import Icon from 'react-native-vector-icons/MaterialIcons'
import { AWS_API_KEY } from '@env'
import api from './services/api'
import Header from './components/Header'

import { AdMobBanner } from "expo-ads-admob";

const COLOR_HEADER = '#9F75F0'
const COLOR_CONTENT = '#F0BB81'

const QTD_ITEMS = 50

const initialState = {    
    error: '',
    text: '17204280',    
    isLoading: false,
    pagini: 1,
    pagfim: QTD_ITEMS,
    total: 0,
    enderecos: [],
}

const testID = 'ca-app-pub-3940256099942544/6300978111';
const productionID = 'ca-app-pub-1688933571403515/5363144067';

export default class Main extends Component{ 
    state = initialState   
    
    constructor(props){
        super(props);

        // Is a real device and running in production.
        const adUnitID = Constants.isDevice && !__DEV__ ? productionID : testID;
    }

    clearState = () => {
        this.setState(initialState) // Retorna o state para os dados iniciais
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
        //Mostra mensagem de erro caso o usuário não preencha o campo    
        if (this.state['text'] === '') {
            this.setState({error: 'Preencha um CEP ou endereço para a consulta!'})            
            return
        }       

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
                pagini: this.state['pagini'],
                pagfim: this.state['pagfim'],                                                        
            }

            const response = await api.post('/busca_endereco_geral', data, config) // Envia a requisição

            console.log(response.data)
            
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
                    
                    this.setState({
                        enderecos,
                        total: retorno.total,
                        pagini: this.state.pagfim + 1,
                        pagfim: this.state.pagfim + QTD_ITEMS,
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


    onSearchPress = () => {   
        /*  Ao apertar o botão de pesquisar irá:
            - Fechar o teclado
            - Limpar o state
            - Realizar a pesquisa
        */             
        Keyboard.dismiss()
        this.clearState()        
        
        this.getData()        
    }    

    onEndScroll = () => {
        /*
            Caso ainda tenha mais itens para ser consultados, realiza a consulta
            senão não faz nada
        */
        if (this.state.pagini >= this.state.total || this.state.isLoading){            
            return
        } else {            
            this.getData()               
        }
    }

    errorBanner(){
        //
        return
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
                            style={[styles.text, styles.textInput]} 
                            placeholder='CEP'
                            multiline={true}
                            onChangeText={text => this.onChangeText(text)}    
                            value={this.state.text}                    
                        />                        
                        <Icon name='search'  size={30} color='#666' style={ styles.searchIcon } onPress={this.onSearchPress}/>
                    </View>
                </Header>

            { (this.state.error != '') && <Text style={styles.textError}>{this.state.error}</Text> }


                { (this.state.enderecos.length > 0) &&
                    <FlatList   
                        styles={styles.lista}                      
                        onEndReached={this.onEndScroll}
                        data = {this.state.enderecos}
                        keyExtractor = {(item) => item.cep}
                        renderItem = { ({item}) => {
                            return(
                                <View key={item.cep} style={[styles.textContainer, styles.resultContainer]}>
                                    <Text style={styles.text}>{item.logradouro}</Text>
                                    <Text style={styles.text}>{item.bairro}</Text>
                                    <Text style={styles.text}>{item.cidade}</Text>
                                    <Text style={styles.text}>{item.uf}</Text>
                                    <Text style={styles.text}>{item.cep}</Text>
                                </View>
                            )
                        }}
                    />
                }   

                <AdMobBanner                    
                    bannerSize="smartBannerLandscape"
                    adUnitID="ca-app-pub-3940256099942544/6300978111" 
                    servePersonalizedAds={false}
                    onDidFailToReceiveAdWithError={this.errorBanner} 
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
        fontSize: 14,        
    },

    textInput: {
        color: '#333'
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
        left: '90%',
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

    lista: {
        marginBottom: 20
    }, 
})